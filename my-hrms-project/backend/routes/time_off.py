from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from config import supabase_admin
from routes.employees import get_current_user_context

router = APIRouter(prefix="/api/time-off", tags=["Time Off"])

class TimeOffRequestInput(BaseModel):
    time_off_type_id: str
    start_date: str # YYYY-MM-DD
    end_date: str   # YYYY-MM-DD
    reason: Optional[str] = None

class ApproveRejectInput(BaseModel):
    request_id: str
    status: str # 'approved' or 'rejected'

@router.get("/types")
def get_time_off_types(user: dict = Depends(get_current_user_context)):
    """Fetch all available leave types for company."""
    company_id = user["company_id"]
    res = supabase_admin.table("time_off_types").select("*").eq("company_id", company_id).execute()
    return {"time_off_types": res.data}

@router.get("/allocations")
def get_allocations(employee_id: Optional[str] = None, user: dict = Depends(get_current_user_context)):
    """Fetch leave allocations and remaining balances."""
    company_id = user["company_id"]
    role = user["role"]
    target_emp_id = employee_id if (role in ["admin", "hr"] and employee_id) else user["id"]

    res = supabase_admin.table("time_off_allocations") \
        .select("*, time_off_types(name, requires_attachment, is_paid)") \
        .eq("employee_id", target_emp_id) \
        .execute()

    return {"allocations": res.data}

@router.post("/requests")
async def create_time_off_request(
    time_off_type_id: str = Form(...),
    start_date: str = Form(...),
    end_date: str = Form(...),
    reason: Optional[str] = Form(None),
    attachment: Optional[UploadFile] = File(None),
    user: dict = Depends(get_current_user_context)
):
    """
    Employee submits time off request.
    Validates balance and requires attachment upload to Supabase Storage if type requires it.
    """
    try:
        company_id = user["company_id"]
        employee_id = user["id"]

        # 1. Fetch leave type requirements
        type_res = supabase_admin.table("time_off_types").select("*").eq("id", time_off_type_id).eq("company_id", company_id).execute()
        if not type_res.data:
            raise HTTPException(status_code=404, detail="Time off type not found")
        
        leave_type = type_res.data[0]

        # 2. Check if attachment is required
        attachment_url = None
        if leave_type.get("requires_attachment") and not attachment:
            raise HTTPException(status_code=400, detail=f"Attachment (certificate) is required for {leave_type['name']}")

        # Upload attachment to Supabase Storage if provided
        if attachment:
            file_bytes = await attachment.read()
            file_path = f"{company_id}/{employee_id}_{int(datetime.now().timestamp())}_{attachment.filename}"
            
            # Ensure bucket exists
            try:
                supabase_admin.storage.create_bucket("leave-attachments", options={"public": True})
            except Exception:
                pass # Bucket may already exist

            storage_res = supabase_admin.storage.from_("leave-attachments").upload(
                path=file_path,
                file=file_bytes,
                file_options={"content-type": attachment.content_type or "application/octet-stream"}
            )
            attachment_url = supabase_admin.storage.from_("leave-attachments").get_public_url(file_path)

        # 3. Calculate requested duration
        s_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        e_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        if e_date < s_date:
            raise HTTPException(status_code=400, detail="End date cannot be earlier than start date")

        req_days = (e_date - s_date).days + 1

        # 4. Check allocation balance
        alloc_res = supabase_admin.table("time_off_allocations") \
            .select("*") \
            .eq("employee_id", employee_id) \
            .eq("time_off_type_id", time_off_type_id) \
            .execute()

        if alloc_res.data:
            alloc = alloc_res.data[0]
            remaining = alloc["allocated_days"] - alloc["used_days"]
            if req_days > remaining:
                raise HTTPException(status_code=400, detail=f"Insufficient leave balance. Remaining: {remaining} days, Requested: {req_days} days.")

        # 5. Insert request record
        req_res = supabase_admin.table("time_off_requests").insert({
            "company_id": company_id,
            "employee_id": employee_id,
            "time_off_type_id": time_off_type_id,
            "start_date": start_date,
            "end_date": end_date,
            "reason": reason,
            "attachment_url": attachment_url,
            "status": "pending"
        }).execute()

        return {
            "message": "Time off request submitted successfully",
            "request": req_res.data[0] if req_res.data else None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/requests")
def list_time_off_requests(employee_id: Optional[str] = None, user: dict = Depends(get_current_user_context)):
    """List time off requests (scoped to employee vs company-wide for Admin/HR)."""
    company_id = user["company_id"]
    role = user["role"]
    target_emp_id = employee_id

    if role not in ["admin", "hr"]:
        target_emp_id = user["id"]

    query = supabase_admin.table("time_off_requests") \
        .select("*, employees!time_off_requests_employee_id_fkey(first_name, last_name, login_id), time_off_types(name)") \
        .eq("company_id", company_id)

    if target_emp_id:
        query = query.eq("employee_id", target_emp_id)

    res = query.order("created_at", desc=True).execute()
    return {"time_off_requests": res.data}

@router.post("/approve-reject")
def approve_reject_time_off(req: ApproveRejectInput, user: dict = Depends(get_current_user_context)):
    """
    ADMIN/HR ONLY: Approve or Reject a time off request.
    On approval, updates time_off_allocations.used_days.
    """
    if user["role"] not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Forbidden: Admin or HR authorization required")

    company_id = user["company_id"]
    reviewer_id = user["id"]

    if req.status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'approved' or 'rejected'")

    # Fetch request
    tor_res = supabase_admin.table("time_off_requests").select("*").eq("id", req.request_id).eq("company_id", company_id).execute()
    if not tor_res.data:
        raise HTTPException(status_code=404, detail="Time off request not found")

    tor = tor_res.data[0]
    if tor["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Request is already {tor['status']}")

    # Update status
    updated_res = supabase_admin.table("time_off_requests").update({
        "status": req.status,
        "reviewed_by": reviewer_id,
        "reviewed_at": datetime.now().isoformat()
    }).eq("id", req.request_id).execute()

    # On Approval: Decrement remaining allocation by adding to used_days
    if req.status == "approved":
        s_date = datetime.strptime(tor["start_date"], "%Y-%m-%d").date()
        e_date = datetime.strptime(tor["end_date"], "%Y-%m-%d").date()
        req_days = (e_date - s_date).days + 1

        alloc_res = supabase_admin.table("time_off_allocations") \
            .select("*") \
            .eq("employee_id", tor["employee_id"]) \
            .eq("time_off_type_id", tor["time_off_type_id"]) \
            .execute()

        if alloc_res.data:
            alloc = alloc_res.data[0]
            new_used = alloc["used_days"] + req_days
            supabase_admin.table("time_off_allocations").update({
                "used_days": new_used
            }).eq("id", alloc["id"]).execute()

    return {
        "message": f"Time off request {req.status} successfully",
        "request": updated_res.data[0] if updated_res.data else None
    }
