from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, time, datetime
from enum import Enum

class EmployeeRole(str, Enum):
    ADMIN = "admin"
    HR = "hr"
    EMPLOYEE = "employee"

class EmployeeStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    TERMINATED = "terminated"

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    ON_LEAVE = "on_leave"
    HOLIDAY = "holiday"
    WEEKEND = "weekend"

class TimeOffStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class MaritalStatus(str, Enum):
    SINGLE = "single"
    MARRIED = "married"
    DIVORCED = "divorced"
    WIDOWED = "widowed"

class GenderType(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"

class SalaryComponentKind(str, Enum):
    EARNING = "earning"
    DEDUCTION = "deduction"

class PayrollStatus(str, Enum):
    DRAFT = "draft"
    PROCESSED = "processed"
    PAID = "paid"

# --- Request / Response Models ---

class CompanyBase(BaseModel):
    name: str
    company_code: str
    logo_url: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: str
    created_at: datetime
    updated_at: datetime

class EmployeeCreate(BaseModel):
    company_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: EmployeeRole = EmployeeRole.EMPLOYEE
    department: Optional[str] = None
    designation: Optional[str] = None
    manager_id: Optional[str] = None
    date_of_joining: date

class EmployeeResponse(BaseModel):
    id: str
    company_id: str
    login_id: str
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: EmployeeRole
    department: Optional[str] = None
    designation: Optional[str] = None
    manager_id: Optional[str] = None
    date_of_joining: date
    serial_of_joining: int
    status: EmployeeStatus
    must_reset_password: bool
    created_at: datetime

class ClockInOutRequest(BaseModel):
    employee_id: str
    company_id: str
    action: str  # "check_in" or "check_out"
    source: Optional[str] = "api"

class TimeOffRequestCreate(BaseModel):
    employee_id: str
    time_off_type_id: str
    start_date: date
    end_date: date
    days: float
    reason: Optional[str] = None
    attachment_url: Optional[str] = None

class TimeOffStatusUpdate(BaseModel):
    status: TimeOffStatus
    reviewed_by: str

class SalaryInfoCreate(BaseModel):
    employee_id: str
    wage_type: str = "monthly"
    monthly_wage: float
    yearly_wage: float
    pf_rate_pct: float = 12.0
    professional_tax: float = 200.0
    currency: str = "INR"

class PayrollRunCreate(BaseModel):
    employee_id: str
    period_month: int
    period_year: int
    payable_days: float
    gross_pay: float
    total_deductions: float
    net_pay: float
