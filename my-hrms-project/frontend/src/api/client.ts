// Centralized API client service with Bearer token authentication & error handling

import {
  AuthResponse,
  UserSession,
  EmployeeRecord,
  EmployeePrivateInfo,
  SalaryInfoResponse,
  AttendanceRecord,
  TimeOffType,
  TimeOffAllocation,
  TimeOffRequest,
  PayrollRun,
  AddEmployeeResult,
} from "../types/hrms";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem("dayflow_access_token");
  } catch {
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set application/json if not sending FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new ApiError(
      `Unable to connect to HRMS server at ${API_BASE_URL}. Please ensure the backend is running.`,
      0,
      netErr
    );
  }

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    let errorMessage = "An error occurred during API request";
    if (data && typeof data === "object") {
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
      } else if (data.message) {
        errorMessage = data.message;
      }
    } else if (typeof data === "string" && data.length > 0) {
      errorMessage = data;
    }

    throw new ApiError(errorMessage, response.status, data);
  }

  return data as T;
}

export const api = {
  // Auth API
  auth: {
    login: (identifier: string, password: string): Promise<AuthResponse> =>
      request<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      }),

    getMe: (): Promise<{ user: UserSession }> =>
      request<{ user: UserSession }>("/api/auth/me"),

    signup: (payload: {
      company_name: string;
      company_alias?: string;
      admin_name: string;
      email: string;
      password: string;
      phone?: string;
    }): Promise<{ message: string; login_id: string; employee: any }> =>
      request("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    addEmployee: (payload: {
      company_id?: string;
      company_name?: string;
      full_name: string;
      email: string;
      role: string;
      phone?: string;
      department?: string;
      designation?: string;
    }): Promise<AddEmployeeResult> =>
      request<AddEmployeeResult>("/api/auth/add-employee", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    uploadCompanyLogo: (file: File): Promise<{ message: string; logo_url: string }> => {
      const formData = new FormData();
      formData.append("logo", file);
      return request<{ message: string; logo_url: string }>(
        "/api/auth/upload-company-logo",
        {
          method: "POST",
          body: formData,
        }
      );
    },

    resetPassword: (
      new_password: string,
      confirm_password: string
    ): Promise<{ message: string; must_reset_password: boolean; employee: any }> =>
      request("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ new_password, confirm_password }),
      }),
  },

  // Employees API
  employees: {
    list: (company_id?: string): Promise<{ employees: EmployeeRecord[] }> => {
      const query = company_id ? `?company_id=${company_id}` : "";
      return request<{ employees: EmployeeRecord[] }>(`/api/employees${query}`);
    },

    getById: (employee_id: string): Promise<{ employee: EmployeeRecord }> =>
      request<{ employee: EmployeeRecord }>(`/api/employees/${employee_id}`),

    getPrivateInfo: (
      employee_id: string
    ): Promise<{ private_info: EmployeePrivateInfo }> =>
      request<{ private_info: EmployeePrivateInfo }>(
        `/api/employees/${employee_id}/private-info`
      ),

    updatePrivateInfo: (
      employee_id: string,
      payload: Partial<EmployeePrivateInfo>
    ): Promise<{ message: string; private_info: EmployeePrivateInfo }> =>
      request(`/api/employees/${employee_id}/private-info`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),

    getSalaryInfo: (employee_id: string): Promise<SalaryInfoResponse> =>
      request<SalaryInfoResponse>(`/api/employees/${employee_id}/salary-info`),

    updateSalaryInfo: (
      employee_id: string,
      payload: {
        month_wage: number;
        yearly_wage?: number;
        working_days_per_week?: number;
        wage_type?: string;
        components?: any[];
      }
    ): Promise<{ message: string; salary_info: any; components: any[] }> =>
      request(`/api/employees/${employee_id}/salary-info`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  },

  // Attendance API
  attendance: {
    checkIn: (
      timestamp?: string
    ): Promise<{ message: string; check_in_time: string; record: AttendanceRecord }> =>
      request("/api/attendance/check-in", {
        method: "POST",
        body: JSON.stringify({ timestamp }),
      }),

    checkOut: (
      timestamp?: string
    ): Promise<{
      message: string;
      work_hours: number;
      extra_hours: number;
      record: AttendanceRecord;
    }> =>
      request("/api/attendance/check-out", {
        method: "POST",
        body: JSON.stringify({ timestamp }),
      }),

    getRecords: (params?: {
      employee_id?: string;
      start_date?: string;
      end_date?: string;
    }): Promise<{ attendance: AttendanceRecord[] }> => {
      const searchParams = new URLSearchParams();
      if (params?.employee_id) searchParams.append("employee_id", params.employee_id);
      if (params?.start_date) searchParams.append("start_date", params.start_date);
      if (params?.end_date) searchParams.append("end_date", params.end_date);
      const queryString = searchParams.toString();
      return request<{ attendance: AttendanceRecord[] }>(
        `/api/attendance/records${queryString ? `?${queryString}` : ""}`
      );
    },

    markAbsentJob: (
      target_date?: string
    ): Promise<{ message: string; absent_count: number }> => {
      const query = target_date ? `?target_date=${target_date}` : "";
      return request(`/api/attendance/mark-absent-job${query}`, {
        method: "POST",
      });
    },
  },

  // Time Off / Leave API
  timeOff: {
    getTypes: (): Promise<{ time_off_types: TimeOffType[] }> =>
      request<{ time_off_types: TimeOffType[] }>("/api/time-off/types"),

    getAllocations: (
      employee_id?: string
    ): Promise<{ allocations: TimeOffAllocation[] }> => {
      const query = employee_id ? `?employee_id=${employee_id}` : "";
      return request<{ allocations: TimeOffAllocation[] }>(
        `/api/time-off/allocations${query}`
      );
    },

    getRequests: (
      employee_id?: string
    ): Promise<{ time_off_requests: TimeOffRequest[] }> => {
      const query = employee_id ? `?employee_id=${employee_id}` : "";
      return request<{ time_off_requests: TimeOffRequest[] }>(
        `/api/time-off/requests${query}`
      );
    },

    createRequest: (
      time_off_type_id: string,
      start_date: string,
      end_date: string,
      reason?: string,
      attachment?: File
    ): Promise<{ message: string; request: TimeOffRequest }> => {
      const formData = new FormData();
      formData.append("time_off_type_id", time_off_type_id);
      formData.append("start_date", start_date);
      formData.append("end_date", end_date);
      if (reason) formData.append("reason", reason);
      if (attachment) formData.append("attachment", attachment);

      return request<{ message: string; request: TimeOffRequest }>(
        "/api/time-off/requests",
        {
          method: "POST",
          body: formData,
        }
      );
    },

    approveReject: (
      request_id: string,
      status: "approved" | "rejected"
    ): Promise<{ message: string; request: TimeOffRequest }> =>
      request("/api/time-off/approve-reject", {
        method: "POST",
        body: JSON.stringify({ request_id, status }),
      }),
  },

  // Payroll API
  payroll: {
    compute: (
      employee_id: string,
      pay_period: string,
      total_days = 30
    ): Promise<{ message: string; payroll_run: PayrollRun }> =>
      request("/api/payroll/compute", {
        method: "POST",
        body: JSON.stringify({ employee_id, pay_period, total_days }),
      }),

    getRuns: (
      employee_id?: string
    ): Promise<{ payroll_runs: PayrollRun[] }> => {
      const query = employee_id ? `?employee_id=${employee_id}` : "";
      return request<{ payroll_runs: PayrollRun[] }>(
        `/api/payroll/runs${query}`
      );
    },
  },

  // Health
  health: (): Promise<any> => request("/health"),
};

export { ApiError, API_BASE_URL };
