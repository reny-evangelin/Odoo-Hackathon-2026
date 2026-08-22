// Shared TypeScript Definitions matching Backend API & Supabase Models

export type UserRole = "admin" | "hr" | "employee";

export type AttendanceStatusType = "present" | "absent" | "half_day" | "on_leave" | "holiday" | "weekend";

export type TimeOffStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface UserSession {
  id: string;
  auth_id?: string;
  login_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: "active" | "inactive" | "terminated";
  company_id: string;
  company_name?: string;
  company_logo_url?: string;
  must_reset_password: boolean;
  department?: string;
  designation?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  must_reset_password: boolean;
  user: UserSession;
  message?: string;
}

export interface EmployeeRecord {
  id: string;
  company_id: string;
  auth_id?: string;
  login_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: "active" | "inactive" | "terminated";
  department?: string;
  designation?: string;
  manager_id?: string;
  joined_date?: string;
  date_of_joining?: string;
  joining_year?: number;
  joining_serial?: number;
  must_reset_password?: boolean;
  created_at?: string;
  avatar_url?: string;
}

export interface EmployeePrivateInfo {
  id?: string;
  company_id?: string;
  employee_id: string;
  date_of_birth?: string;
  marital_status?: string;
  nationality?: string;
  gender?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  pan_no?: string;
  aadhaar_no?: string;
}

export interface SalaryComponent {
  id?: string;
  salary_id?: string;
  component_name: string;
  component_type: "earning" | "deduction";
  computation_type: "fixed_amount" | "percentage_of_wage";
  value: number;
  calculated_amount?: number;
}

export interface SalaryInfo {
  id?: string;
  company_id?: string;
  employee_id: string;
  month_wage: number;
  yearly_wage?: number;
  working_days_per_week?: number;
  wage_type?: string;
  pf_rate_pct?: number;
  professional_tax?: number;
  currency?: string;
}

export interface SalaryInfoResponse {
  salary_info: SalaryInfo | null;
  components: SalaryComponent[];
}

export interface AttendanceRecord {
  id: string;
  company_id?: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  work_hours?: number;
  extra_hours?: number;
  status: AttendanceStatusType;
  remarks?: string;
  location?: string;
  employees?: {
    full_name?: string;
    login_id?: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface TimeOffType {
  id: string;
  company_id: string;
  name: string;
  requires_attachment: boolean;
  max_days_per_year: number;
}

export interface TimeOffAllocation {
  id: string;
  company_id: string;
  employee_id: string;
  time_off_type_id: string;
  total_days: number;
  used_days: number;
  time_off_types?: {
    name: string;
    requires_attachment: boolean;
    max_days_per_year: number;
  };
}

export interface TimeOffRequest {
  id: string;
  company_id: string;
  employee_id: string;
  time_off_type_id: string;
  start_date: string;
  end_date: string;
  days?: number;
  reason?: string;
  attachment_url?: string;
  status: TimeOffStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
  employees?: {
    full_name?: string;
    login_id?: string;
  };
  time_off_types?: {
    name?: string;
  };
}

export interface PayrollRun {
  id: string;
  company_id?: string;
  employee_id: string;
  pay_period: string;
  total_days: number;
  payable_days: number;
  base_salary: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
  status: "draft" | "processed" | "paid";
  created_at?: string;
  employees?: {
    full_name?: string;
    login_id?: string;
  };
}

export interface Company {
  id: string;
  name: string;
  alias?: string;
  company_code?: string;
  logo_url?: string;
  created_at?: string;
}

export interface AddEmployeeResult {
  message: string;
  employee: EmployeeRecord;
  login_id: string;
  temporary_password?: string;
  temporary_credentials?: {
    login_id: string;
    email: string;
    temporary_password: string;
    must_reset_password: boolean;
  };
}

export interface ToastNotification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}
