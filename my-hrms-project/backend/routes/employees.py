from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional, List
from config import supabase_admin, supabase

router = APIRouter(prefix="/api/employees", tags=["Employees"])

# Helper to verify token and extract employee context & role
def get_current_user_context(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Bearer token")
    
    token = authorization.split(" ")[1]
    try:
        user_res = supabase.auth.get_user(token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        auth_id = user_res.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    emp_res = supabase_admin.table("employees").select("*").eq("user_id", auth_id).execute()
    if not emp_res.data:
        raise HTTPException(status_code=404, detail="Employee record not found for user")

    return emp_res.data[0]

# Request models
class PrivateInfoRequest(BaseModel):
    date_of_birth: Optional[str] = None
    marital_status: Optional[str] = None
    nationality: Optional[str] = None
    gender: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    pan_no: Optional[str] = None
    aadhaar_no: Optional[str] = None

class SalaryComponentInput(BaseModel):
    component_name: str
    component_type: str # 'earning', 'deduction'
    computation_type: str # 'fixed_amount', 'percentage_of_wage'
    value: float

class SalaryInfoRequest(BaseModel):
    month_wage: float
    yearly_wage: Optional[float] = None
    working_days_per_week: int = 5
    wage_type: str = "monthly"
    components: Optional[List[SalaryComponentInput]] = None

@router.get("")
def list_employees(user: dict = Depends(get_current_user_context)):
    """List all employees belonging to the company."""
    company_id = user["company_id"]
    res = supabase_admin.table("employees").select("*").eq("company_id", company_id).execute()
    return {"employees": res.data}

@router.get("/{employee_id}")
def get_employee(employee_id: str, user: dict = Depends(get_current_user_context)):
    """Fetch single employee profile."""
    company_id = user["company_id"]
    res = supabase_admin.table("employees").select("*").eq("id", employee_id).eq("company_id", company_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"employee": res.data[0]}

@router.get("/{employee_id}/private-info")
def get_private_info(employee_id: str, user: dict = Depends(get_current_user_context)):
    """
    Readable by owner or admin/hr only.
    """
    company_id = user["company_id"]
    role = user["role"]
    current_emp_id = user["id"]

    if role not in ["admin", "hr"] and current_emp_id != employee_id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view private info of other employees")

    res = supabase_admin.table("employee_private_info").select("*").eq("employee_id", employee_id).eq("company_id", company_id).execute()
    return {"private_info": res.data[0] if res.data else {}}

@router.put("/{employee_id}/private-info")
def update_private_info(employee_id: str, req: PrivateInfoRequest, user: dict = Depends(get_current_user_context)):
    """
    Writable by owner or admin/hr only.
    """
    company_id = user["company_id"]
    role = user["role"]
    current_emp_id = user["id"]

    if role not in ["admin", "hr"] and current_emp_id != employee_id:
        raise HTTPException(status_code=403, detail="Forbidden: You cannot modify another employee's private info")

    data = {k: v for k, v in req.dict().items() if v is not None}
    data["company_id"] = company_id
    data["employee_id"] = employee_id

    res = supabase_admin.table("employee_private_info").upsert(data, on_conflict="employee_id").execute()
    return {"message": "Private info updated", "private_info": res.data[0] if res.data else {}}

@router.get("/{employee_id}/salary-info")
def get_salary_info(employee_id: str, user: dict = Depends(get_current_user_context)):
    """
    ADMIN ONLY ENDPOINT.
    """
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Salary info is restricted to Admins only")

    company_id = user["company_id"]
    sal_res = supabase_admin.table("salary_info").select("*").eq("employee_id", employee_id).eq("company_id", company_id).execute()
    
    if not sal_res.data:
        return {"salary_info": None, "components": []}

    salary = sal_res.data[0]
    comp_res = supabase_admin.table("salary_components").select("*").eq("salary_id", salary["id"]).execute()

    return {
        "salary_info": salary,
        "components": comp_res.data
    }

@router.put("/{employee_id}/salary-info")
def update_salary_info(employee_id: str, req: SalaryInfoRequest, user: dict = Depends(get_current_user_context)):
    """
    ADMIN ONLY ENDPOINT. Automatically computes standard breakdown if components not provided:
    Basic: 50% of Wage
    HRA: 50% of Basic (25% of Wage)
    Performance Bonus: 8.33%
    LTA: 8.33%
    Fixed Allowance: Remainder offset
    """
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required to update salary info")

    company_id = user["company_id"]
    month_wage = req.month_wage
    yearly_wage = req.yearly_wage or (month_wage * 12)

    # Insert or update salary_info
    sal_data = {
        "company_id": company_id,
        "employee_id": employee_id,
        "month_wage": month_wage,
        "yearly_wage": yearly_wage,
        "working_days_per_week": req.working_days_per_week,
        "wage_type": req.wage_type
    }
    sal_res = supabase_admin.table("salary_info").upsert(sal_data, on_conflict="employee_id").execute()
    salary = sal_res.data[0]
    salary_id = salary["id"]

    # Delete existing components
    supabase_admin.table("salary_components").delete().eq("salary_id", salary_id).execute()

    # Default auto-computation if no components explicitly supplied
    if not req.components:
        basic = round(month_wage * 0.50, 2)
        hra = round(basic * 0.50, 2)
        bonus = round(month_wage * 0.0833, 2)
        lta = round(month_wage * 0.0833, 2)
        fixed_allowance = round(month_wage - (basic + hra + bonus + lta), 2)

        components_to_insert = [
            {"salary_id": salary_id, "component_name": "Basic", "component_type": "earning", "computation_type": "percentage_of_wage", "value": 50.0, "calculated_amount": basic},
            {"salary_id": salary_id, "component_name": "House Rent Allowance", "component_type": "earning", "computation_type": "percentage_of_wage", "value": 25.0, "calculated_amount": hra},
            {"salary_id": salary_id, "component_name": "Performance Bonus", "component_type": "earning", "computation_type": "percentage_of_wage", "value": 8.33, "calculated_amount": bonus},
            {"salary_id": salary_id, "component_name": "Leave Travel Allowance", "component_type": "earning", "computation_type": "percentage_of_wage", "value": 8.33, "calculated_amount": lta},
            {"salary_id": salary_id, "component_name": "Fixed Allowance", "component_type": "earning", "computation_type": "fixed_amount", "value": fixed_allowance, "calculated_amount": fixed_allowance},
            {"salary_id": salary_id, "component_name": "Employee PF (12%)", "component_type": "deduction", "computation_type": "percentage_of_wage", "value": 12.0, "calculated_amount": round(basic * 0.12, 2)},
            {"salary_id": salary_id, "component_name": "Professional Tax", "component_type": "deduction", "computation_type": "fixed_amount", "value": 200.0, "calculated_amount": 200.0}
        ]
    else:
        components_to_insert = []
        for c in req.components:
            calc_amt = c.value if c.computation_type == "fixed_amount" else round(month_wage * (c.value / 100.0), 2)
            components_to_insert.append({
                "salary_id": salary_id,
                "component_name": c.component_name,
                "component_type": c.component_type,
                "computation_type": c.computation_type,
                "value": c.value,
                "calculated_amount": calc_amt
            })

    comp_res = supabase_admin.table("salary_components").insert(components_to_insert).execute()

    return {
        "message": "Salary info and components updated successfully",
        "salary_info": salary,
        "components": comp_res.data
    }
