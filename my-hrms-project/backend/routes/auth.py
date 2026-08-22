from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional
from config import supabase, supabase_admin

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Request models
class SignUpRequest(BaseModel):
    company_name: str
    company_alias: str = "COMP"
    admin_name: str
    email: str
    password: str
    phone: Optional[str] = None

class AddEmployeeRequest(BaseModel):
    company_id: str
    full_name: str
    email: str
    role: str = "employee" # 'admin', 'hr', 'employee'
    phone: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    new_password: str

@router.post("/signup")
def signup_company_admin(req: SignUpRequest):
    """
    Sign Up Flow: Creates a new company + the first admin employee.
    """
    try:
        # 1. Create company row
        comp_res = supabase_admin.table("companies").insert({
            "name": req.company_name,
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
            "work_start_time": "09:00:00",
            "work_end_time": "17:00:00",
            "working_days_per_week": 5
        }).execute()

        pto_type = supabase_admin.table("time_off_types").insert({
            "company_id": company_id,
            "name": "Paid Time Off",
            "requires_attachment": False,
            "max_days_per_year": 24
        }).execute()

        sick_type = supabase_admin.table("time_off_types").insert({
            "company_id": company_id,
            "name": "Sick Leave",
            "requires_attachment": True,
            "max_days_per_year": 7
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

        # 4. Insert Admin employee record (trigger generates login_id)
        emp_res = supabase_admin.table("employees").insert({
            "company_id": company_id,
            "auth_id": auth_user_id,
            "full_name": req.admin_name,
            "email": req.email,
            "phone": req.phone,
            "role": "admin",
            "must_reset_password": False
        }).execute()

        if not emp_res.data:
            raise HTTPException(status_code=400, detail="Employee record creation failed")

        employee = emp_res.data[0]

        # Allocate default leave balances
        if pto_type.data:
            supabase_admin.table("time_off_allocations").insert({
                "company_id": company_id,
                "employee_id": employee["id"],
                "time_off_type_id": pto_type.data[0]["id"],
                "total_days": 24,
                "used_days": 0
            }).execute()

        if sick_type.data:
            supabase_admin.table("time_off_allocations").insert({
                "company_id": company_id,
                "employee_id": employee["id"],
                "time_off_type_id": sick_type.data[0]["id"],
                "total_days": 7,
                "used_days": 0
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

        # 2. Insert employee row (trigger handles joining_serial & login_id)
        emp_res = supabase_admin.table("employees").insert({
            "company_id": req.company_id,
            "auth_id": auth_user_id,
            "full_name": req.full_name,
            "email": req.email,
            "phone": req.phone,
            "role": req.role,
            "must_reset_password": True
        }).execute()

        if not emp_res.data:
            raise HTTPException(status_code=400, detail="Failed to insert employee record")

        employee = emp_res.data[0]

        # 3. Create time off allocations for new employee
        tot_res = supabase_admin.table("time_off_types").select("*").eq("company_id", req.company_id).execute()
        if tot_res.data:
            for leave_type in tot_res.data:
                supabase_admin.table("time_off_allocations").insert({
                    "company_id": req.company_id,
                    "employee_id": employee["id"],
                    "time_off_type_id": leave_type["id"],
                    "total_days": leave_type["max_days_per_year"],
                    "used_days": 0
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
        }).eq("auth_id", auth_id).execute()

        return {
            "message": "Password updated successfully. You may now log in with your new password.",
            "employee": emp_res.data[0] if emp_res.data else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
