from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from config import supabase, supabase_admin

router = APIRouter(prefix="/api/auth", tags=["Auth"])

import re
from pydantic import EmailStr, field_validator, StringConstraints
from typing_extensions import Annotated

# Request models with strict Pydantic validation
class SignUpRequest(BaseModel):
    company_name: str
    company_alias: str = "COMP"
    admin_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

    @field_validator("company_name", "admin_name")
    @classmethod
    def validate_non_empty_name(cls, value: str, info) -> str:
        v = value.strip()
        if not v or len(v) < 2:
            raise ValueError(f"{info.field_name.replace('_', ' ').title()} must be at least 2 characters long.")
        if len(v) > 100:
            raise ValueError(f"{info.field_name.replace('_', ' ').title()} cannot exceed 100 characters.")
        return v

    @field_validator("company_alias")
    @classmethod
    def validate_alias(cls, value: str) -> str:
        alias = value.strip().upper()
        if not re.match(r"^[A-Z0-9]{2,10}$", alias):
            raise ValueError("Company alias must be 2 to 10 alphanumeric characters (e.g. ACME, COMP1).")
        return alias

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must contain at least one digit.")
        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError("Password must contain at least one special character.")
        return value

class AddEmployeeRequest(BaseModel):
    company_id: str
    full_name: str
    email: EmailStr
    role: str = "employee" # 'admin', 'hr', 'employee'
    phone: Optional[str] = None

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str) -> str:
        name = value.strip()
        if len(name) < 2 or len(name) > 100:
            raise ValueError("Full name must be between 2 and 100 characters.")
        return name

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        role = value.strip().lower()
        if role not in ("admin", "hr", "employee"):
            raise ValueError("Role must be one of: 'admin', 'hr', 'employee'.")
        return role

class SignInRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_not_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Password cannot be empty.")
        return value

class ResetPasswordRequest(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("New password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", value):
            raise ValueError("New password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", value):
            raise ValueError("New password must contain at least one digit.")
        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError("New password must contain at least one special character.")
        return value

# ---------------------------------------------------------------------------
# SIGN IN — validates credentials via Supabase Auth, returns JWT + profile
# ---------------------------------------------------------------------------
@router.post("/signin")
def signin(req: SignInRequest):
    """
    Sign In: Validates email/password against Supabase Auth.
    Returns access_token, refresh_token, and the employee profile with role.
    """
    try:
        # Authenticate against Supabase Auth (returns session on success,
        # raises AuthApiError on invalid credentials)
        auth_res = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })

        if not auth_res.session or not auth_res.user:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        auth_id = auth_res.user.id
        session  = auth_res.session

        # Fetch the employees row for profile + role
        emp_res = supabase_admin.table("employees") \
            .select("*") \
            .eq("user_id", auth_id) \
            .single() \
            .execute()

        if not emp_res.data:
            raise HTTPException(
                status_code=404,
                detail="No employee profile found for this account."
            )

        employee = emp_res.data

        # Fetch company name if available
        company_name = None
        company_id = employee.get("company_id")
        if company_id:
            try:
                comp_res = supabase_admin.table("companies").select("name").eq("id", company_id).single().execute()
                if comp_res.data:
                    company_name = comp_res.data.get("name")
            except Exception:
                pass

        return {
            "access_token":  session.access_token,
            "refresh_token": session.refresh_token,
            "token_type":    "Bearer",
            "employee":      employee,
            "company_name":  company_name,
            "role":          employee.get("role", "employee"),
            "must_reset_password": employee.get("must_reset_password", False),
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        # Surface Supabase invalid-credentials errors as 401, not 500
        if "Invalid login credentials" in error_msg or "invalid_grant" in error_msg:
            raise HTTPException(status_code=401, detail="Invalid email or password.")
        raise HTTPException(status_code=500, detail=error_msg)


# ---------------------------------------------------------------------------
# ME — validates a Bearer token and returns the current employee profile
# Used to restore session on page reload without re-entering credentials
# ---------------------------------------------------------------------------
@router.get("/me")
def get_me(authorization: Optional[str] = Header(None)):
    """
    Session restore: verifies the access_token and returns the employee profile.
    Call this on app mount to check whether an existing session is still valid.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1]

    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Token expired or invalid")

        auth_id = user_res.user.id

        emp_res = supabase_admin.table("employees") \
            .select("*") \
            .eq("user_id", auth_id) \
            .single() \
            .execute()

        if not emp_res.data:
            raise HTTPException(status_code=404, detail="Employee profile not found")

        employee = emp_res.data

        company_name = None
        company_id = employee.get("company_id")
        if company_id:
            try:
                comp_res = supabase_admin.table("companies").select("name").eq("id", company_id).single().execute()
                if comp_res.data:
                    company_name = comp_res.data.get("name")
            except Exception:
                pass

        return {
            "employee": employee,
            "company_name": company_name,
            "role":     employee.get("role", "employee"),
            "must_reset_password": employee.get("must_reset_password", False),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")


@router.post("/signup")
def signup_company_admin(req: SignUpRequest):
    """
    Sign Up Flow: Creates a new company + the first admin employee.
    """
    try:
        # 1. Create company row
        comp_res = supabase_admin.table("companies").insert({
            "name": req.company_name,
            "company_code": req.company_alias.upper(),
            "alias": req.company_alias.upper()
        }).execute()
        
        if not comp_res.data:
            raise HTTPException(status_code=400, detail="Failed to create company")
            
        company = comp_res.data[0]
        company_id = company["id"]

        # 2. Seed default schedule & time-off types for the company
        supabase_admin.table("attendance_schedules").insert({
            "company_id": company_id,
            "name": "Standard Schedule",
            "working_days": [1, 2, 3, 4, 5],
            "shift_start": "09:00:00",
            "shift_end": "17:00:00",
        }).execute()

        pto_type = supabase_admin.table("time_off_types").insert({
            "company_id": company_id,
            "name": "Paid Time Off",
            "is_paid": True,
            "requires_attachment": False,
        }).execute()

        sick_type = supabase_admin.table("time_off_types").insert({
            "company_id": company_id,
            "name": "Sick Leave",
            "is_paid": True,
            "requires_attachment": True,
        }).execute()

        # 3. Create Auth user in Supabase Auth
        auth_res = supabase_admin.auth.admin.create_user({
            "email": req.email,
            "password": req.password,
            "email_confirm": True
        })
        
        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Auth user creation failed")
            
        auth_user_id = auth_res.user.id

        # Split admin_name into first_name and last_name
        name_parts = req.admin_name.strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else "X"

        # Generate login_id
        from datetime import datetime
        year = datetime.now().year
        login_id = f"{req.company_alias.upper()}{first_name[:2].upper()}{last_name[:2].upper()}{year}0001"

        # 4. Insert Admin employee record
        emp_res = supabase_admin.table("employees").insert({
            "company_id": company_id,
            "user_id": auth_user_id,
            "first_name": first_name,
            "last_name": last_name,
            "login_id": login_id,
            "email": req.email,
            "phone": req.phone,
            "role": "admin",
            "date_of_joining": datetime.now().strftime("%Y-%m-%d"),
            "serial_of_joining": 1,
            "must_reset_password": False
        }).execute()

        if not emp_res.data:
            raise HTTPException(status_code=400, detail="Employee record creation failed")

        employee = emp_res.data[0]

        # Allocate default leave balances
        if pto_type.data:
            supabase_admin.table("time_off_allocations").insert({
                "employee_id": employee["id"],
                "time_off_type_id": pto_type.data[0]["id"],
                "allocated_days": 24,
                "used_days": 0,
                "validity_start": f"{year}-01-01",
                "validity_end": f"{year}-12-31"
            }).execute()

        if sick_type.data:
            supabase_admin.table("time_off_allocations").insert({
                "employee_id": employee["id"],
                "time_off_type_id": sick_type.data[0]["id"],
                "allocated_days": 7,
                "used_days": 0,
                "validity_start": f"{year}-01-01",
                "validity_end": f"{year}-12-31"
            }).execute()

        return {
            "message": "Company and Admin registered successfully",
            "company": company,
            "employee": employee
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add-employee")
def add_employee(req: AddEmployeeRequest):
    """
    Add Employee Flow (Admin/HR only):
    Creates an auth.users row with a temporary password, auto-generates login_id,
    creates employees row with must_reset_password = true.
    """
    try:
        temp_password = f"Temp@{req.company_id[:4]}2026!"

        # 1. Create auth user with temp password
        auth_res = supabase_admin.auth.admin.create_user({
            "email": req.email,
            "password": temp_password,
            "email_confirm": True
        })

        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Failed to create auth user")

        auth_user_id = auth_res.user.id

        # Fetch company code / alias
        comp_res = supabase_admin.table("companies").select("company_code").eq("id", req.company_id).single().execute()
        comp_code = comp_res.data.get("company_code", "COMP") if comp_res.data else "COMP"

        # Get existing employees to find next serial
        emp_data_res = supabase_admin.table("employees").select("serial_of_joining").eq("company_id", req.company_id).execute()
        existing_serials = [e["serial_of_joining"] for e in emp_data_res.data] if emp_data_res.data else []
        serial = max(existing_serials) + 1 if existing_serials else 1

        name_parts = req.full_name.strip().split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else "X"

        from datetime import datetime
        year = datetime.now().year
        login_id = f"{comp_code.upper()}{first_name[:2].upper()}{last_name[:2].upper()}{year}{serial:04d}"

        # 2. Insert employee row
        emp_res = supabase_admin.table("employees").insert({
            "company_id": req.company_id,
            "user_id": auth_user_id,
            "first_name": first_name,
            "last_name": last_name,
            "login_id": login_id,
            "email": req.email,
            "phone": req.phone,
            "role": req.role,
            "date_of_joining": datetime.now().strftime("%Y-%m-%d"),
            "serial_of_joining": serial,
            "must_reset_password": True
        }).execute()

        if not emp_res.data:
            raise HTTPException(status_code=400, detail="Failed to insert employee record")

        employee = emp_res.data[0]

        # 3. Create time off allocations for new employee
        tot_res = supabase_admin.table("time_off_types").select("*").eq("company_id", req.company_id).execute()
        if tot_res.data:
            for leave_type in tot_res.data:
                allocated = 24 if "paid" in leave_type["name"].lower() else (7 if "sick" in leave_type["name"].lower() else 30)
                supabase_admin.table("time_off_allocations").insert({
                    "employee_id": employee["id"],
                    "time_off_type_id": leave_type["id"],
                    "allocated_days": allocated,
                    "used_days": 0,
                    "validity_start": f"{year}-01-01",
                    "validity_end": f"{year}-12-31"
                }).execute()

        return {
            "message": "Employee created successfully",
            "employee": employee,
            "temporary_password": temp_password,
            "login_id": employee.get("login_id")
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, authorization: Optional[str] = Header(None)):
    """
    Forced password reset on first login when must_reset_password is true.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ")[1]
    try:
        # Verify user token
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        auth_id = user_res.user.id

        # Update password in Supabase Auth
        supabase_admin.auth.admin.update_user_by_id(auth_id, {"password": req.new_password})

        # Set must_reset_password = false in employees table
        emp_res = supabase_admin.table("employees").update({
            "must_reset_password": False
        }).eq("user_id", auth_id).execute()

        return {
            "message": "Password updated successfully. You may now log in with your new password.",
            "employee": emp_res.data[0] if emp_res.data else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
