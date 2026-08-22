from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from config import supabase_admin
from routes.employees import get_current_user_context

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])

class PayrollComputeRequest(BaseModel):
    employee_id: str
    pay_period: str # e.g. "2026-08"
    total_days: int = 30

@router.post("/compute")
def compute_payroll(req: PayrollComputeRequest, user: dict = Depends(get_current_user_context)):
    """
    Computes payroll for an employee for a specified pay period.
    Payable Days = (Days present/half-day + Paid Time Off) - Absent days.
    Calculates gross earnings, deductions (PF, Tax), and net pay.
    """
    if user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Forbidden: Admin or HR access required")

    company_id = user["company_id"]
    employee_id = req.employee_id
    pay_period = req.pay_period

    # 1. Fetch Salary Info & Components
    sal_res = supabase_admin.table("salary_info").select("*").eq("employee_id", employee_id).eq("company_id", company_id).execute()
    if not sal_res.data:
        raise HTTPException(status_code=404, detail="Salary info not configured for employee")

    salary = sal_res.data[0]
    monthly_wage = salary["month_wage"]

    comp_res = supabase_admin.table("salary_components").select("*").eq("salary_id", salary["id"]).execute()
    components = comp_res.data or []

    # Calculate base components
    total_earnings = 0.0
    total_deductions = 0.0

    for c in components:
        amt = c.get("calculated_amount", 0.0)
        if c["component_type"] == "earning":
            total_earnings += amt
        elif c["component_type"] == "deduction":
            total_deductions += amt

    if total_earnings == 0.0:
        total_earnings = monthly_wage

    # 2. Compute attendance & payable days for pay period
    start_date = f"{pay_period}-01"
    end_date = f"{pay_period}-31"

    att_res = supabase_admin.table("attendance_records") \
        .select("*") \
        .eq("employee_id", employee_id) \
        .gte("date", start_date) \
        .lte("date", end_date) \
        .execute()

    records = att_res.data or []
    present_days = sum(1.0 if r["status"] == "present" else 0.5 for r in records if r["status"] in ["present", "half_day"])
    absent_days = sum(1.0 for r in records if r["status"] == "absent")

    # Payable days calculation ratio
    payable_days = max(0.0, float(req.total_days) - absent_days)
    proration_factor = payable_days / float(req.total_days)

    gross_pay = round(total_earnings * proration_factor, 2)
    deductions = round(total_deductions * proration_factor, 2)
    net_pay = round(gross_pay - deductions, 2)

    # 3. Create or update payroll run record
    run_data = {
        "company_id": company_id,
        "employee_id": employee_id,
        "pay_period": pay_period,
        "total_days": req.total_days,
        "payable_days": payable_days,
        "base_salary": gross_pay,
        "bonuses": 0.0,
        "deductions": deductions,
        "net_pay": net_pay,
        "status": "processed"
    }

    run_res = supabase_admin.table("payroll_runs").insert(run_data).execute()

    return {
        "message": f"Payroll computed for {pay_period}",
        "payroll_run": run_res.data[0] if run_res.data else run_data
    }

@router.get("/runs")
def list_payroll_runs(employee_id: Optional[str] = None, user: dict = Depends(get_current_user_context)):
    """List payroll runs (scoped to employee vs company-wide)."""
    company_id = user["company_id"]
    role = user["role"]
    target_emp_id = employee_id

    if role not in ["admin", "hr"]:
        target_emp_id = user["id"]

    query = supabase_admin.table("payroll_runs").select("*, employees(full_name, login_id)").eq("company_id", company_id)
    if target_emp_id:
        query = query.eq("employee_id", target_emp_id)

    res = query.order("created_at", desc=True).execute()
    return {"payroll_runs": res.data}
