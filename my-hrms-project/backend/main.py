from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import uvicorn

from config import PORT, SUPABASE_URL
from models import (
    CompanyCreate, CompanyResponse,
    EmployeeCreate, EmployeeResponse,
    ClockInOutRequest, TimeOffRequestCreate, TimeOffStatusUpdate,
    SalaryInfoCreate, PayrollRunCreate
)
from database import HRMSDatabase
from routes.auth import router as auth_router

app = FastAPI(
    title="HRMS Backend API",
    description="Backend API Service for Human Resource Management System connected to Supabase",
    version="1.0.0"
)
app.include_router(auth_router)

# Enable CORS for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = HRMSDatabase()

# --- Health & Diagnostic Endpoints ---

@app.get("/")
def read_root():
    return {
        "service": "HRMS Backend API",
        "status": "online",
        "supabase_url": SUPABASE_URL,
        "docs": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
def check_health():
    """Verify backend and Supabase database connection health."""
    health_status = db.check_health()
    return {
        "backend": "healthy",
        "database": health_status,
        "supabase_url": SUPABASE_URL
    }

# --- Company Endpoints ---

@app.get("/api/companies")
def list_companies():
    """Fetch all registered companies (tenants)."""
    return db.get_companies()

@app.post("/api/companies", status_code=status.HTTP_201_CREATED)
def create_company(company: CompanyCreate):
    """Register a new company tenant."""
    try:
        return db.create_company(name=company.name, company_code=company.company_code, logo_url=company.logo_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Employee Endpoints ---

@app.get("/api/employees")
def list_employees(company_id: Optional[str] = Query(None, description="Filter by company ID")):
    """List all employees."""
    return db.get_employees(company_id=company_id)

@app.get("/api/employees/{employee_id}")
def get_employee(employee_id: str):
    """Retrieve detailed employee profile by ID."""
    emp = db.get_employee_by_id(employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@app.post("/api/employees", status_code=status.HTTP_201_CREATED)
def create_employee(emp: EmployeeCreate):
    """Create a new employee profile with auto-generated login_id."""
    try:
        return db.create_employee(emp.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Attendance Endpoints ---

@app.get("/api/attendance")
def get_attendance(company_id: Optional[str] = None, work_date: Optional[str] = None):
    """List attendance records."""
    return db.get_attendance(company_id=company_id, work_date=work_date)

@app.post("/api/attendance/clock")
def clock_in_out(req: ClockInOutRequest):
    """Record clock-in or clock-out event for an employee."""
    try:
        return db.record_attendance_event(employee_id=req.employee_id, action=req.action, source=req.source or "api")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Time Off (Leave) Endpoints ---

@app.get("/api/timeoff/types")
def get_time_off_types(company_id: str):
    """Get leave types configured for a company."""
    return db.get_time_off_types(company_id=company_id)

@app.get("/api/timeoff/requests")
def list_time_off_requests(employee_id: Optional[str] = None, status: Optional[str] = None):
    """Get time off requests filtered by employee or status."""
    return db.get_time_off_requests(employee_id=employee_id, status=status)

@app.post("/api/timeoff/requests", status_code=status.HTTP_201_CREATED)
def submit_time_off_request(req: TimeOffRequestCreate):
    """Submit a new leave request."""
    try:
        return db.create_time_off_request(req.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/api/timeoff/requests/{request_id}")
def update_time_off_status(request_id: str, update: TimeOffStatusUpdate):
    """Approve or reject a leave request."""
    try:
        return db.update_time_off_status(request_id=request_id, status=update.status.value, reviewed_by=update.reviewed_by)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- Salary & Payroll Endpoints ---

@app.get("/api/salary/{employee_id}")
def get_salary_info(employee_id: str):
    """Get salary breakdown for an employee (Admin only)."""
    try:
        salary = db.get_salary_info(employee_id)
        if not salary:
            raise HTTPException(status_code=404, detail="Salary information not found for employee")
        return salary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Employee salary record not found: {str(e)}")

@app.post("/api/salary")
def save_salary_info(salary: SalaryInfoCreate):
    """Upsert salary configuration for an employee."""
    try:
        return db.upsert_salary_info(salary.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/payroll")
def get_payroll_runs(month: Optional[int] = Query(None, ge=1, le=12), year: Optional[int] = Query(None)):
    """Fetch payroll runs for a period."""
    return db.get_payroll_runs(month=month, year=year)

@app.post("/api/payroll", status_code=status.HTTP_201_CREATED)
def create_payroll_run(payroll: PayrollRunCreate):
    """Process a new payroll run."""
    try:
        return db.create_payroll_run(payroll.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
