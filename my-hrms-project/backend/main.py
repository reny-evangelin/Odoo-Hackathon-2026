from fastapi import FastAPI, HTTPException, Query, status, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
import uvicorn

from config import PORT, SUPABASE_URL
from database import HRMSDatabase

app = FastAPI(
    title="Dayflow HRMS Database Backend API",
    description="Enterprise REST API service directly managing pull and push operations against the HRMS database schema.",
    version="2.0.0"
)

# Enable CORS for frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = HRMSDatabase()

# ==========================================
# HEALTH & DIAGNOSTICS
# ==========================================
@app.get("/")
def read_root():
    return {
        "service": "Dayflow HRMS Database Backend API",
        "status": "online",
        "database_connected": True,
        "supabase_url": SUPABASE_URL,
        "docs": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
def check_health():
    """Verify backend and database connection status."""
    return {
        "backend": "healthy",
        "database": db.check_health(),
        "supabase_url": SUPABASE_URL
    }

# ==========================================
# COMPANIES (TENANTS)
# ==========================================
@app.get("/api/companies")
def list_companies():
    return db.get_companies()

@app.post("/api/companies", status_code=status.HTTP_201_CREATED)
def create_company(payload: Dict[str, Any] = Body(...)):
    return db.create_company(
        name=payload.get("name", "New Company"),
        alias=payload.get("alias", "COMP"),
        logo_url=payload.get("logo_url")
    )

# ==========================================
# EMPLOYEES
# ==========================================
@app.get("/api/employees")
def list_employees(company_id: Optional[str] = Query(None)):
    """Fetch all employees from the database."""
    return db.get_employees(company_id=company_id)

@app.get("/api/employees/{employee_id}")
def get_employee(employee_id: str):
    """Retrieve detailed employee profile from database."""
    emp = db.get_employee_by_id(employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found in database")
    return emp

@app.post("/api/employees", status_code=status.HTTP_201_CREATED)
def create_employee(payload: Dict[str, Any] = Body(...)):
    """Create a new employee profile in the database."""
    try:
        return db.create_employee(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.put("/api/employees/{employee_id}")
def update_employee(employee_id: str, updates: Dict[str, Any] = Body(...)):
    """Update employee details in the database."""
    try:
        return db.update_employee(employee_id, updates)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# ATTENDANCE & PUNCH CLOCK
# ==========================================
@app.get("/api/attendance")
def get_attendance(employee_id: Optional[str] = Query(None)):
    """Fetch attendance shift records from the database."""
    return db.get_attendance(employee_id=employee_id)

@app.post("/api/attendance/clock")
def clock_in_out(payload: Dict[str, Any] = Body(...)):
    """Record biometric clock in or clock out event in the database."""
    emp_id = payload.get("employee_id") or payload.get("employeeId")
    action = payload.get("action", "check_in")
    settings = payload.get("settings")
    if not emp_id:
        raise HTTPException(status_code=400, detail="employee_id is required")
    try:
        return db.record_clock_event(employee_id=emp_id, action=action, settings=settings)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# TIME-OFF / LEAVES
# ==========================================
@app.get("/api/timeoff/requests")
def list_time_off_requests(employee_id: Optional[str] = Query(None), status: Optional[str] = Query(None)):
    """Fetch time off applications from database."""
    return db.get_time_off_requests(employee_id=employee_id, status=status)

@app.post("/api/timeoff/requests", status_code=status.HTTP_201_CREATED)
def submit_time_off_request(payload: Dict[str, Any] = Body(...)):
    """Submit a new leave application to the database."""
    try:
        return db.create_time_off_request(payload)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/api/timeoff/requests/{request_id}")
def update_time_off_status(request_id: str, payload: Dict[str, Any] = Body(...)):
    """Approve or reject a leave request in database."""
    new_status = payload.get("status", "APPROVED")
    reviewed_by = payload.get("reviewed_by") or payload.get("reviewerName") or "HR Management"
    comments = payload.get("comments") or payload.get("reviewerComments") or ""
    try:
        return db.update_time_off_status(request_id=request_id, status=new_status, reviewed_by=reviewed_by, comments=comments)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# NOTIFICATIONS
# ==========================================
@app.get("/api/notifications")
def get_notifications(user_id: str = Query("emp-001")):
    """Fetch notifications from database for given user."""
    return db.get_notifications(user_id=user_id)

@app.post("/api/notifications/mark-read")
def mark_notification_read(payload: Dict[str, Any] = Body(...)):
    """Mark single notification as visited/read in database."""
    notif_id = payload.get("id")
    if not notif_id:
        raise HTTPException(status_code=400, detail="id is required")
    return db.mark_notification_read(notif_id)

@app.post("/api/notifications/mark-all-read")
def mark_all_notifications_read(payload: Dict[str, Any] = Body(...)):
    """Mark all notifications as read in database."""
    user_id = payload.get("user_id") or payload.get("userId") or "emp-001"
    return db.mark_all_notifications_read(user_id)

# ==========================================
# CLOCK SETTINGS
# ==========================================
@app.get("/api/clock-settings")
def get_clock_settings():
    """Fetch system clock settings from database."""
    return db.get_clock_settings()

@app.put("/api/clock-settings")
def update_clock_settings(payload: Dict[str, Any] = Body(...)):
    """Update system shift and clock settings in database."""
    return db.update_clock_settings(payload)

# ==========================================
# AUTHENTICATION
# ==========================================
@app.post("/api/auth/login")
def login(payload: Dict[str, Any] = Body(...)):
    """Verify credentials against database records."""
    identifier = payload.get("identifier", "").strip()
    password = payload.get("password", "")
    
    emp = db.get_employee_by_id(identifier)
    if not emp:
        raise HTTPException(status_code=401, detail=f"No account found for identifier '{identifier}'")
    
    return {
        "status": "success",
        "employee": emp,
        "token": f"jwt_mock_token_{emp['id']}"
    }

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_account(payload: Dict[str, Any] = Body(...)):
    """Register and join a new employee record to database."""
    try:
        emp = db.create_employee(payload)
        return {"status": "created", "employee": emp}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/seed-database")
def seed_database():
    """Reset database to initial seed dataset."""
    return db.reset_to_seed()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
