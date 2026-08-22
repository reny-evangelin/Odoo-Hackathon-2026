from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, time
from config import supabase_admin
from routes.employees import get_current_user_context

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])

class CheckInRequest(BaseModel):
    timestamp: Optional[str] = None # ISO format timestamp string or server now

class CheckOutRequest(BaseModel):
    timestamp: Optional[str] = None

@router.post("/check-in")
def check_in(req: CheckInRequest, user: dict = Depends(get_current_user_context)):
    """
    Log check-in event and initialize or update daily attendance record.
    """
    try:
        company_id = user["company_id"]
        employee_id = user["id"]
        now_dt = datetime.fromisoformat(req.timestamp) if req.timestamp else datetime.now()
        today_date = now_dt.date()
        current_time_str = now_dt.time().strftime("%H:%M:%S")

        # 1. Record raw event
        supabase_admin.table("attendance_events").insert({
            "company_id": company_id,
            "employee_id": employee_id,
            "event_type": "check_in",
            "timestamp": now_dt.isoformat()
        }).execute()

        # 2. Upsert daily attendance record
        rec_res = supabase_admin.table("attendance_records").select("*").eq("employee_id", employee_id).eq("date", today_date.isoformat()).execute()
        
        if rec_res.data:
            existing = rec_res.data[0]
            # Keep earlier check-in time
            check_in_val = existing["check_in"] or current_time_str
            rec = supabase_admin.table("attendance_records").update({
                "check_in": check_in_val,
                "status": "present"
            }).eq("id", existing["id"]).execute()
        else:
            rec = supabase_admin.table("attendance_records").insert({
                "company_id": company_id,
                "employee_id": employee_id,
                "date": today_date.isoformat(),
                "check_in": current_time_str,
                "status": "present"
            }).execute()

        return {
            "message": "Checked in successfully",
            "check_in_time": current_time_str,
            "record": rec.data[0] if rec.data else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-out")
def check_out(req: CheckOutRequest, user: dict = Depends(get_current_user_context)):
    """
    Log check-out event and calculate work_hours & extra_hours server-side.
    """
    try:
        company_id = user["company_id"]
        employee_id = user["id"]
        now_dt = datetime.fromisoformat(req.timestamp) if req.timestamp else datetime.now()
        today_date = now_dt.date()
        check_out_time_str = now_dt.time().strftime("%H:%M:%S")

        # 1. Record raw event
        supabase_admin.table("attendance_events").insert({
            "company_id": company_id,
            "employee_id": employee_id,
            "event_type": "check_out",
            "timestamp": now_dt.isoformat()
        }).execute()

        # 2. Reconcile daily record
        rec_res = supabase_admin.table("attendance_records").select("*").eq("employee_id", employee_id).eq("date", today_date.isoformat()).execute()
        
        if not rec_res.data or not rec_res.data[0].get("check_in"):
            raise HTTPException(status_code=400, detail="Cannot check out without an existing check-in today")

        record = rec_res.data[0]
        check_in_time = datetime.strptime(record["check_in"], "%H:%M:%S").time()
        
        # Calculate server duration
        check_in_dt = datetime.combine(today_date, check_in_time)
        total_seconds = (now_dt - check_in_dt).total_seconds()
        total_hours = max(0.0, round(total_seconds / 3600.0, 2))

        # Standard schedule is 8 hours
        standard_hours = 8.0
        work_hours = min(total_hours, standard_hours)
        extra_hours = max(0.0, round(total_hours - standard_hours, 2))

        status_val = "present"
        if total_hours < 4.0:
            status_val = "half_day"

        rec = supabase_admin.table("attendance_records").update({
            "check_out": check_out_time_str,
            "work_hours": total_hours,
            "extra_hours": extra_hours,
            "status": status_val
        }).eq("id", record["id"]).execute()

        return {
            "message": "Checked out successfully",
            "work_hours": total_hours,
            "extra_hours": extra_hours,
            "record": rec.data[0] if rec.data else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/records")
def list_attendance(
    employee_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user: dict = Depends(get_current_user_context)
):
    """
    List attendance records. Employee sees only their own; Admin/HR can query all.
    """
    company_id = user["company_id"]
    role = user["role"]
    target_emp_id = employee_id

    if role not in ["admin", "hr"]:
        target_emp_id = user["id"] # Force own records for regular employees

    query = supabase_admin.table("attendance_records").select("*, employees(full_name, login_id)").eq("company_id", company_id)

    if target_emp_id:
        query = query.eq("employee_id", target_emp_id)
    if start_date:
        query = query.gte("date", start_date)
    if end_date:
        query = query.lte("date", end_date)

    res = query.order("date", desc=True).execute()
    return {"attendance": res.data}

@router.post("/mark-absent-job")
def mark_absent_job(target_date: Optional[str] = None, user: dict = Depends(get_current_user_context)):
    """
    Scheduled job: Marks active employees 'absent' if no attendance record exists for the given date.
    Admin/HR authorization required.
    """
    if user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Admin or HR authorization required for absent marking job")

    company_id = user["company_id"]
    job_date = target_date or date.today().isoformat()

    # 1. Fetch active employees
    emp_res = supabase_admin.table("employees").select("id").eq("company_id", company_id).eq("status", "active").execute()
    all_emp_ids = [e["id"] for e in emp_res.data]

    # 2. Fetch existing records for target date
    rec_res = supabase_admin.table("attendance_records").select("employee_id").eq("company_id", company_id).eq("date", job_date).execute()
    recorded_emp_ids = set(r["employee_id"] for r in rec_res.data)

    # 3. Insert absent records for employees with no check in
    absent_records = []
    for emp_id in all_emp_ids:
        if emp_id not in recorded_emp_ids:
            absent_records.append({
                "company_id": company_id,
                "employee_id": emp_id,
                "date": job_date,
                "work_hours": 0,
                "extra_hours": 0,
                "status": "absent"
            })

    if absent_records:
        supabase_admin.table("attendance_records").insert(absent_records).execute()

    return {
        "message": f"Absent job processed for date {job_date}",
        "absent_count": len(absent_records)
    }
