from fastapi import APIRouter, HTTPException, Depends, Header, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from typing import Optional
import secrets
import string
import re
from datetime import datetime, date

from config import supabase, supabase_admin
from routes.employees import get_current_user_context, get_auth_session_context

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# ---------------------------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    identifier: str  # Can be Login ID (e.g. OIJOD20230001) or Email
    password: str

class SignUpRequest(BaseModel):
    company_name: str
    company_alias: str = "COMP"
    admin_name: str
    email: str
    password: str
    phone: Optional[str] = None

class AddEmployeeJsonRequest(BaseModel):
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    full_name: str
    email: EmailStr
    role: str = "employee"  # 'admin', 'hr', 'employee'
    phone: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    new_password: str
    confirm_password: Optional[str] = None


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validates that a new password meets enterprise complexity rules:
    - Minimum 8 characters
    - At least 1 uppercase letter
    - At least 1 lowercase letter
    - At least 1 digit
    - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter (A-Z)"
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter (a-z)"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit (0-9)"
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        return False, "Password must contain at least one special character (!@#$%^&*)"
    return True, "Valid"

def generate_temporary_password(length: int = 12) -> str:

    """
    Generates a cryptographically secure, high-entropy temporary password (CSPRNG).
    Guarantees at least 2 uppercase, 2 lowercase, 2 digits, 2 special characters,
    shuffled with OS-level entropy to prevent any predictable pattern.
    """
    if length < 8:
        length = 12

    uppers = [secrets.choice(string.ascii_uppercase) for _ in range(2)]
    lowers = [secrets.choice(string.ascii_lowercase) for _ in range(2)]
    digits = [secrets.choice(string.digits) for _ in range(2)]
    specials = [secrets.choice("!@#$%^&*") for _ in range(2)]

    remaining_len = length - 8
    all_chars = string.ascii_letters + string.digits + "!@#$%^&*"
    remaining = [secrets.choice(all_chars) for _ in range(remaining_len)]

    chars = uppers + lowers + digits + specials + remaining
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)

def build_login_id(company_code_or_alias: str, full_name: str, year: int, serial: int) -> str:
    """
    Constructs Login ID per specification:
    [Company Identifier][Employee Name Identifier][Year of Joining][4-digit Serial Number]
    e.g. OIJOD20230001 (Company: OI, First name: John (JO) + Last name: Doe (D) -> JOD, Year: 2023, Serial: 0001)
    """
    comp_id = (company_code_or_alias or "COMP").upper().strip()
    comp_id = ''.join(ch for ch in comp_id if ch.isalnum()) or "COMP"

    parts = full_name.strip().split()
    if len(parts) >= 2:
        fn = parts[0]
        ln = parts[-1]
        fn_code = fn[:2].upper() if len(fn) >= 2 else (fn + "X").upper()
        ln_code = ln[:1].upper() if len(ln) >= 1 else "X"
        name_code = f"{fn_code}{ln_code}"
    elif len(parts) == 1 and len(parts[0]) >= 2:
        name_code = (parts[0][:2] + "X").upper()
    else:
        name_code = "EMX"

    serial_str = f"{serial:04d}"
    return f"{comp_id}{name_code}{year}{serial_str}"

# ---------------------------------------------------------------------------
# Auth Endpoints
# ---------------------------------------------------------------------------

@router.post("/login")
def login(req: LoginRequest):
    """
    Login Endpoint:
    Allows user to log in with either Login ID (e.g. OEJD20260001) or Email Address.
    Returns access token, user details, role, and must_reset_password flag.
    """
    identifier = req.identifier.strip()
    password = req.password

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Please provide both Login ID/Email and password")

    target_email = identifier

    # If identifier does not have '@', resolve via login_id lookup in employees table
    if "@" not in identifier:
        emp_lookup = supabase_admin.table("employees").select("*").ilike("login_id", identifier).execute()
        if not emp_lookup.data:
            raise HTTPException(status_code=401, detail="Invalid Login ID/Email or password")
        
        target_employee = emp_lookup.data[0]
        target_email = target_employee.get("email")
    else:
        emp_lookup = supabase_admin.table("employees").select("*").ilike("email", target_email).execute()
        target_employee = emp_lookup.data[0] if emp_lookup.data else None

    # Authenticate via Supabase Auth
    try:
        auth_res = supabase.auth.sign_in_with_password({
            "email": target_email,
            "password": password
        })
    except Exception as e:
        err_msg = str(e).lower()
        if "invalid" in err_msg or "credential" in err_msg or "password" in err_msg:
            raise HTTPException(status_code=401, detail="Invalid Login ID/Email or password")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

    if not auth_res or not auth_res.user:
        raise HTTPException(status_code=401, detail="Invalid Login ID/Email or password")

    auth_user = auth_res.user
    auth_user_id = auth_user.id

    # Fetch up-to-date employee record linked to auth user
    if not target_employee or target_employee.get("auth_id") != auth_user_id:
        emp_res = supabase_admin.table("employees").select("*").eq("auth_id", auth_user_id).execute()
        if not emp_res.data:
            emp_res = supabase_admin.table("employees").select("*").eq("email", target_email).execute()
        target_employee = emp_res.data[0] if emp_res.data else None

    if not target_employee:
        raise HTTPException(status_code=404, detail="Employee profile record not found for this account")

    if target_employee.get("status") == "inactive" or target_employee.get("status") == "terminated":
        raise HTTPException(status_code=403, detail="Account is deactivated. Please contact your Administrator.")

    # Fetch company record for branding & details
    company_id = target_employee.get("company_id")
    company_data = {}
    if company_id:
        comp_res = supabase_admin.table("companies").select("*").eq("id", company_id).execute()
        if comp_res.data:
            company_data = comp_res.data[0]

    must_reset = bool(target_employee.get("must_reset_password", False))

    return {
        "access_token": auth_res.session.access_token if auth_res.session else "",
        "refresh_token": auth_res.session.refresh_token if auth_res.session else "",
        "token_type": "bearer",
        "must_reset_password": must_reset,
        "user": {
            "id": target_employee["id"],
            "auth_id": auth_user_id,
            "login_id": target_employee.get("login_id"),
            "full_name": target_employee.get("full_name"),
            "email": target_employee.get("email"),
            "phone": target_employee.get("phone"),
            "role": target_employee.get("role", "employee"),
            "status": target_employee.get("status", "active"),
            "company_id": company_id,
            "company_name": company_data.get("name"),
            "company_logo_url": company_data.get("logo_url"),
            "must_reset_password": must_reset
        }
    }

@router.get("/me")
def get_current_user(user: dict = Depends(get_auth_session_context)):
    """
    Session verification: returns current authenticated employee details and company info.
    Accessible even if must_reset_password is True so client can inspect user status.
    """
    company_id = user.get("company_id")
    company_data = {}
    if company_id:
        comp_res = supabase_admin.table("companies").select("*").eq("id", company_id).execute()
        if comp_res.data:
            company_data = comp_res.data[0]

    return {
        "user": {
            **user,
            "company_name": company_data.get("name"),
            "company_logo_url": company_data.get("logo_url")
        }
    }


@router.post("/signup")
def signup_company_admin(req: SignUpRequest):
    """
    Sign Up Flow: Initial registration for new Company + First Admin Employee.
    """
    try:
        comp_alias = req.company_alias.upper().strip() or req.company_name[:4].upper()
        # 1. Create company row
        comp_res = supabase_admin.table("companies").insert({
            "name": req.company_name,
            "alias": comp_alias
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
        current_year = date.today().year
        admin_login_id = build_login_id(comp_alias, req.admin_name, current_year, 1)

        # 4. Insert Admin employee record
        emp_res = supabase_admin.table("employees").insert({
            "company_id": company_id,
            "auth_id": auth_user_id,
            "login_id": admin_login_id,
            "full_name": req.admin_name,
            "email": req.email,
            "phone": req.phone,
            "role": "admin",
            "status": "active",
            "joined_date": date.today().isoformat(),
            "joining_year": current_year,
            "joining_serial": 1,
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
            "employee": employee,
            "login_id": admin_login_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/add-employee")
def add_employee(
    req: AddEmployeeJsonRequest,
    user: dict = Depends(get_current_user_context)
):
    """
    Admin / HR Employee Creation Flow:
    1. Enforces that only Admin or HR callers can create new employee accounts.
    2. Collects Company Name, Employee Name, Email, Phone Number, Role.
    3. Auto-calculates next sequential serial for company and joining year.
    4. Auto-generates unique Login ID (e.g. OIJOD20230001) with database uniqueness verification.
    5. Auto-generates a secure 12-char CSPRNG temporary password.
    6. Creates auth.users identity in Supabase (which securely hashes the password via bcrypt).
    7. Inserts employee row into PostgreSQL employees table with must_reset_password = True.
    8. No plaintext password is stored in the database.
    9. Returns generated Login ID and Temporary Password for the Admin/HR to distribute.
    """
    # 1. Enforce Admin / HR Authorization
    caller_role = (user.get("role") or "").lower()
    if caller_role not in ["admin", "hr"]:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Only Admin or HR users have permission to create employee accounts"
        )

    company_id = req.company_id or user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="Company ID is required to create an employee")

    try:
        # 2. Fetch company info to get alias/code and update company name if provided
        comp_res = supabase_admin.table("companies").select("*").eq("id", company_id).execute()
        if not comp_res.data:
            raise HTTPException(status_code=404, detail="Company not found")
        
        company = comp_res.data[0]
        comp_alias = company.get("alias") or company.get("company_code") or "COMP"

        if req.company_name and req.company_name.strip() and req.company_name.strip() != company.get("name"):
            supabase_admin.table("companies").update({"name": req.company_name.strip()}).eq("id", company_id).execute()

        # 3. Check if an employee with this email already exists
        existing_emp = supabase_admin.table("employees").select("id").eq("email", req.email).execute()
        if existing_emp.data:
            raise HTTPException(status_code=400, detail=f"An employee with email '{req.email}' already exists")

        # 4. Calculate next joining serial for this company and joining year
        current_year = date.today().year
        emp_serials_res = supabase_admin.table("employees").select("joining_serial") \
            .eq("company_id", company_id) \
            .eq("joining_year", current_year) \
            .execute()
        
        existing_serials = [e["joining_serial"] for e in emp_serials_res.data if e.get("joining_serial")]
        next_serial = (max(existing_serials) + 1) if existing_serials else 1

        # 5. Generate Login ID and ensure strict uniqueness against collision
        login_id = build_login_id(comp_alias, req.full_name, current_year, next_serial)
        while True:
            collision_check = supabase_admin.table("employees").select("id").eq("login_id", login_id).execute()
            if not collision_check.data:
                break
            next_serial += 1
            login_id = build_login_id(comp_alias, req.full_name, current_year, next_serial)

        # 6. Generate 12-character CSPRNG temporary password
        temp_password = generate_temporary_password(12)

        # 7. Create user in Supabase Auth (stores bcrypt encrypted_password hash)
        auth_res = supabase_admin.auth.admin.create_user({
            "email": req.email,
            "password": temp_password,
            "email_confirm": True
        })

        if not auth_res or not auth_res.user:
            raise HTTPException(status_code=400, detail="Failed to create auth identity in identity provider")

        auth_user_id = auth_res.user.id

        # 8. Insert employee row with must_reset_password = True (zero plaintext password stored)
        emp_payload = {
            "company_id": company_id,
            "auth_id": auth_user_id,
            "login_id": login_id,
            "full_name": req.full_name,
            "email": req.email,
            "phone": req.phone,
            "role": req.role,
            "status": "active",
            "joined_date": date.today().isoformat(),
            "joining_year": current_year,
            "joining_serial": next_serial,
            "must_reset_password": True
        }

        emp_res = supabase_admin.table("employees").insert(emp_payload).execute()
        if not emp_res.data:
            raise HTTPException(status_code=400, detail="Failed to insert employee record into database")

        employee = emp_res.data[0]

        # 9. Seed default time off allocations for new employee
        tot_res = supabase_admin.table("time_off_types").select("*").eq("company_id", company_id).execute()
        if tot_res.data:
            for leave_type in tot_res.data:
                supabase_admin.table("time_off_allocations").insert({
                    "company_id": company_id,
                    "employee_id": employee["id"],
                    "time_off_type_id": leave_type["id"],
                    "total_days": leave_type.get("max_days_per_year", 24),
                    "used_days": 0
                }).execute()

        return {
            "message": "Employee created successfully",
            "employee": employee,
            "login_id": login_id,
            "temporary_password": temp_password,
            "temporary_credentials": {
                "login_id": login_id,
                "email": req.email,
                "temporary_password": temp_password,
                "must_reset_password": True
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-company-logo")
async def upload_company_logo(
    logo: UploadFile = File(...),
    user: dict = Depends(get_current_user_context)
):
    """
    Company Logo Upload (Admin / HR only):
    Uploads logo image to Supabase Storage bucket 'company-logos' and updates company record.
    """
    if user.get("role") not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Forbidden: Admin or HR permissions required")

    company_id = user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="No company associated with user")

    try:
        file_bytes = await logo.read()
        file_ext = logo.filename.split(".")[-1] if "." in logo.filename else "png"
        file_path = f"{company_id}/logo_{int(datetime.now().timestamp())}.{file_ext}"

        # Ensure bucket exists
        try:
            supabase_admin.storage.create_bucket("company-logos", options={"public": True})
        except Exception:
            pass

        # Upload file
        supabase_admin.storage.from_("company-logos").upload(
            path=file_path,
            file=file_bytes,
            file_options={"content-type": logo.content_type or "image/png", "upsert": "true"}
        )

        public_url = supabase_admin.storage.from_("company-logos").get_public_url(file_path)

        # Update company table
        supabase_admin.table("companies").update({"logo_url": public_url}).eq("id", company_id).execute()

        return {
            "message": "Company logo uploaded successfully",
            "logo_url": public_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload logo: {str(e)}")

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, authorization: Optional[str] = Header(None)):
    """
    Change Password / Forced Password Reset:
    1. Accepts new_password and confirm_password.
    2. Validates both are provided and match.
    3. Validates password strength (min 8 chars, uppercase, lowercase, digit, special symbol).
    4. Updates password in Supabase Auth (stored as bcrypt hash).
    5. Sets must_reset_password = false in PostgreSQL employees table.
    6. Enables user to access protected routes normally.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ")[1]
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid or expired session token")

        auth_id = user_res.user.id

        # 1. Validate inputs
        if not req.new_password:
            raise HTTPException(status_code=400, detail="New password is required")

        if req.confirm_password is not None:
            if not req.confirm_password:
                raise HTTPException(status_code=400, detail="Confirm password is required")
            if req.new_password != req.confirm_password:
                raise HTTPException(status_code=400, detail="New password and confirm password do not match")

        # 2. Validate password strength & complexity
        is_valid, msg = validate_password_strength(req.new_password)
        if not is_valid:
            raise HTTPException(status_code=400, detail=msg)

        # 3. Update password in Supabase Auth (securely hashed via bcrypt in auth.users)
        supabase_admin.auth.admin.update_user_by_id(auth_id, {"password": req.new_password})

        # 4. Set must_reset_password = false in PostgreSQL employees table
        emp_res = supabase_admin.table("employees").update({
            "must_reset_password": False
        }).eq("auth_id", auth_id).execute()

        return {
            "message": "Password changed successfully! You may now access your dashboard.",
            "must_reset_password": False,
            "employee": emp_res.data[0] if emp_res.data else None
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

