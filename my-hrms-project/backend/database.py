from datetime import datetime, date
from typing import List, Dict, Any, Optional
from config import get_supabase_client
import logging

logger = logging.getLogger("hrms.database")

class HRMSDatabase:
    """Supabase Data Access Layer for HRMS System."""
    
    def __init__(self):
        self.client = get_supabase_client()

    def check_health(self) -> Dict[str, Any]:
        """Test connection to Supabase database."""
        try:
            res = self.client.table("companies").select("count", count="exact").limit(1).execute()
            return {"status": "connected", "companies_count": res.count if hasattr(res, 'count') else 0}
        except Exception as e:
            logger.error(f"Supabase connection test failed: {e}")
            return {"status": "error", "message": str(e)}

    # --- Companies ---
    def get_companies(self) -> List[Dict[str, Any]]:
        res = self.client.table("companies").select("*").execute()
        return res.data or []

    def create_company(self, name: str, company_code: str, logo_url: Optional[str] = None) -> Dict[str, Any]:
        data = {"name": name, "company_code": company_code, "logo_url": logo_url}
        res = self.client.table("companies").insert(data).execute()
        return res.data[0] if res.data else {}

    # --- Employees ---
    def get_employees(self, company_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.client.table("employees").select("*")
        if company_id:
            query = query.eq("company_id", company_id)
        res = query.execute()
        return res.data or []

    def get_employee_by_id(self, employee_id: str) -> Optional[Dict[str, Any]]:
        res = self.client.table("employees").select("*").eq("id", employee_id).execute()
        return res.data[0] if res.data else None

    def create_employee(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates serial_of_joining and login_id, then creates employee record.
        login_id format: CompanyCode + 2FirstLettersFirstName + 2FirstLettersLastName + Year + 4DigitSerial
        """
        company_id = data["company_id"]
        joining_date = datetime.strptime(data["date_of_joining"], "%Y-%m-%d") if isinstance(data["date_of_joining"], str) else data["date_of_joining"]
        year = joining_date.year

        # Get company code
        comp_res = self.client.table("companies").select("company_code").eq("id", company_id).execute()
        comp_code = comp_res.data[0]["company_code"] if comp_res.data else "01"

        # Get next serial for company + year
        emp_res = self.client.table("employees").select("serial_of_joining").eq("company_id", company_id).execute()
        existing_serials = [e["serial_of_joining"] for e in emp_res.data or []]
        serial = (max(existing_serials) + 1) if existing_serials else 1

        # Generate login_id
        fn_code = data["first_name"][:2].upper()
        ln_code = data["last_name"][:2].upper()
        login_id = f"{comp_code}{fn_code}{ln_code}{year}{serial:04d}"

        payload = {
            **data,
            "serial_of_joining": serial,
            "login_id": login_id,
            "date_of_joining": str(data["date_of_joining"])
        }
        res = self.client.table("employees").insert(payload).execute()
        return res.data[0] if res.data else {}

    # --- Attendance ---
    def get_attendance(self, company_id: Optional[str] = None, work_date: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.client.table("attendance_records").select("*, employees(first_name, last_name, login_id)")
        if company_id:
            query = query.eq("company_id", company_id)
        if work_date:
            query = query.eq("work_date", work_date)
        res = query.execute()
        return res.data or []

    def record_attendance_event(self, employee_id: str, action: str, source: str = "api") -> Dict[str, Any]:
        """Logs check-in or check-out event."""
        event_data = {
            "employee_id": employee_id,
            "event_type": action,
            "source": source
        }
        res = self.client.table("attendance_events").insert(event_data).execute()
        
        # Upsert into attendance_records for current date
        today_str = datetime.now().strftime("%Y-%m-%d")
        emp = self.get_employee_by_id(employee_id)
        company_id = emp["company_id"] if emp else None

        existing = self.client.table("attendance_records").select("*").eq("employee_id", employee_id).eq("work_date", today_str).execute()
        
        if existing.data:
            rec_id = existing.data[0]["id"]
            update_fields = {}
            if action == "check_in":
                update_fields["check_in"] = datetime.now().isoformat()
                update_fields["status"] = "present"
            elif action == "check_out":
                update_fields["check_out"] = datetime.now().isoformat()
                # Compute hours if check_in exists
                check_in_time = existing.data[0].get("check_in")
                if check_in_time:
                    cin = datetime.fromisoformat(check_in_time.replace("Z", "+00:00"))
                    hours = (datetime.now(cin.tzinfo) - cin).total_seconds() / 3600.0
                    update_fields["work_hours"] = round(hours, 2)
            
            self.client.table("attendance_records").update(update_fields).eq("id", rec_id).execute()
        else:
            new_record = {
                "employee_id": employee_id,
                "company_id": company_id,
                "work_date": today_str,
                "status": "present" if action == "check_in" else "absent",
                "check_in": datetime.now().isoformat() if action == "check_in" else None
            }
            self.client.table("attendance_records").insert(new_record).execute()

        return res.data[0] if res.data else {}

    # --- Time Off (Leave) ---
    def get_time_off_types(self, company_id: str) -> List[Dict[str, Any]]:
        res = self.client.table("time_off_types").select("*").eq("company_id", company_id).execute()
        return res.data or []

    def get_time_off_requests(self, employee_id: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = self.client.table("time_off_requests").select("*, employees!time_off_requests_employee_id_fkey(first_name, last_name, login_id), time_off_types(name)")
        if employee_id:
            query = query.eq("employee_id", employee_id)
        if status:
            query = query.eq("status", status)
        res = query.execute()
        return res.data or []

    def create_time_off_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        payload = {
            **data,
            "start_date": str(data["start_date"]),
            "end_date": str(data["end_date"]),
            "status": "pending"
        }
        res = self.client.table("time_off_requests").insert(payload).execute()
        return res.data[0] if res.data else {}

    def update_time_off_status(self, request_id: str, status: str, reviewed_by: str) -> Dict[str, Any]:
        update_data = {
            "status": status,
            "reviewed_by": reviewed_by,
            "reviewed_at": datetime.now().isoformat()
        }
        res = self.client.table("time_off_requests").update(update_data).eq("id", request_id).execute()
        return res.data[0] if res.data else {}

    # --- Salary & Payroll ---
    def get_salary_info(self, employee_id: str) -> Optional[Dict[str, Any]]:
        res = self.client.table("salary_info").select("*").eq("employee_id", employee_id).execute()
        return res.data[0] if res.data else None

    def upsert_salary_info(self, data: Dict[str, Any]) -> Dict[str, Any]:
        res = self.client.table("salary_info").upsert(data).execute()
        return res.data[0] if res.data else {}

    def get_payroll_runs(self, month: Optional[int] = None, year: Optional[int] = None) -> List[Dict[str, Any]]:
        query = self.client.table("payroll_runs").select("*, employees(first_name, last_name, login_id)")
        if month:
            query = query.eq("period_month", month)
        if year:
            query = query.eq("period_year", year)
        res = query.execute()
        return res.data or []

    def create_payroll_run(self, data: Dict[str, Any]) -> Dict[str, Any]:
        res = self.client.table("payroll_runs").insert(data).execute()
        return res.data[0] if res.data else {}
