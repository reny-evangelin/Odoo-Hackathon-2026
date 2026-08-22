import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  createContext,
  useContext,
} from "react";
import {
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Search,
  Plus,
  ChevronDown,
  LogOut,
  Bell,
  Settings,
  Shield,
  Briefcase,
  Building,
  Mail,
  MapPin,
  CalendarDays,
  Check,
  X,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Layers,
  Menu,
  Sparkles,
  Clock4,
  Coffee,
  CheckSquare,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  UserPlus,
  ShieldCheck,
  Activity,
  Database,
} from "lucide-react";

// ============================================================
// REGION 01 — CONFIGURATION & TYPES
// ============================================================

export type UserRole = "EMPLOYEE" | "HR" | "ADMIN";

export type AttendanceStatusType = "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "WEEKEND";

export type LeaveType = "PAID" | "SICK" | "CASUAL" | "UNPAID";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "TERMINATED" | "PROBATION";

export interface ClockSettings {
  shiftStartTime: string;
  shiftEndTime: string;
  breakDurationMinutes: number;
  overtimeThresholdHours: number;
  workLocation: "Office (HQ)" | "Remote" | "Hybrid";
  timeFormat: "12h" | "24h";
  autoClockOut: boolean;
}

export const DEFAULT_CLOCK_SETTINGS: ClockSettings = {
  shiftStartTime: "09:00",
  shiftEndTime: "18:00",
  breakDurationMinutes: 45,
  overtimeThresholdHours: 8.0,
  workLocation: "Office (HQ)",
  timeFormat: "12h",
  autoClockOut: false,
};

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;
  phone: string;
  address: string;
  avatarUrl: string;
  department: string;
  designation: string;
  role: UserRole;
  status: EmployeeStatus;
  joiningDate: string;
  managerName: string;
  workLocation: "Office (HQ)" | "Remote" | "Hybrid";
  salary: {
    basic: number;
    hra: number;
    specialAllowance: number;
    providentFund: number;
    taxDeduction: number;
    currency: string;
  };
  leaveBalances: {
    paid: number;
    sick: number;
    casual: number;
    unpaid: number;
  };
  documents: {
    id: string;
    name: string;
    type: string;
    uploadDate: string;
    size: string;
  }[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockInTime: string | null;
  clockOutTime: string | null;
  breakDurationMinutes: number;
  totalWorkHours: number;
  status: AttendanceStatusType;
  remarks?: string;
  location?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  employeeDepartment: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerComments?: string;
  reviewedDate?: string;
}

export interface ApprovalItem {
  id: string;
  type: "LEAVE" | "ATTENDANCE_CORRECTION" | "EXPENSE";
  referenceId: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  employeeRole: string;
  title: string;
  details: string;
  dateRange: string;
  durationText: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  priority: "NORMAL" | "HIGH" | "URGENT";
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ACTION_REQUIRED";
  timestamp: string;
  isRead: boolean;
  targetTab?: NavigationTab;
}

export type NavigationTab =
  | "dashboard"
  | "directory"
  | "attendance"
  | "leaves"
  | "approvals"
  | "payroll"
  | "settings";

// ============================================================
// REGION 02 — DESIGN TOKENS & UTILITIES
// ============================================================

export const TOKENS = {
  colors: {
    primary: {
      default: "#4F46E5",
      hover: "#4338CA",
      subtle: "#EEF2FF",
      light: "#C7D2FE",
      dark: "#312E81",
    },
    success: {
      default: "#10B981",
      hover: "#059669",
      bg: "#ECFDF5",
      text: "#065F46",
      border: "#A7F3D0",
    },
    warning: {
      default: "#F59E0B",
      hover: "#D97706",
      bg: "#FFFBEB",
      text: "#92400E",
      border: "#FDE68A",
    },
    danger: {
      default: "#EF4444",
      hover: "#DC2626",
      bg: "#FEF2F2",
      text: "#991B1B",
      border: "#FECACA",
    },
    surface: {
      canvas: "#F9FAFB",
      card: "#FFFFFF",
      cardHover: "#F9FAFB",
      border: "#E5E7EB",
      sidebar: "#111827",
      sidebarHover: "#1F2937",
      sidebarActive: "#4F46E5",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
      muted: "#9CA3AF",
      inverted: "#FFFFFF",
      link: "#4F46E5",
    },
  },
} as const;

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getLocalDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalTimeString(d = new Date()): string {
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch (e) {}
  }
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(16)}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidEmployeeCode(code: string): boolean {
  return /^DF-\d{3,5}$/i.test(code.trim());
}

// ============================================================
// REGION 03 — DATABASE REST API CLIENT LAYER (ALL DATA FROM DB)
// ============================================================

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://127.0.0.1:5000";

export interface IDayflowAPI {
  getEmployees: () => Promise<Employee[]>;
  getEmployeeById: (id: string) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<Employee>;
  createEmployee: (employee: Omit<Employee, "id">) => Promise<Employee>;
  getAttendanceRecords: (employeeId?: string) => Promise<AttendanceRecord[]>;
  clockIn: (employeeId: string, settings?: ClockSettings) => Promise<AttendanceRecord>;
  clockOut: (employeeId: string, settings?: ClockSettings) => Promise<AttendanceRecord>;
  getLeaveRequests: () => Promise<LeaveRequest[]>;
  applyLeave: (request: Omit<LeaveRequest, "id" | "status" | "appliedDate">) => Promise<LeaveRequest>;
  reviewLeave: (leaveId: string, status: "APPROVED" | "REJECTED", comments?: string) => Promise<LeaveRequest>;
  getNotifications: (userId: string) => Promise<NotificationItem[]>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;
  getClockSettings: () => Promise<ClockSettings>;
  saveClockSettings: (settings: ClockSettings) => Promise<ClockSettings>;
  resetToSeedData: () => Promise<void>;
  loginUser: (identifier: string, passwordHash?: string) => Promise<Employee>;
}

class DayflowDatabaseRESTClient implements IDayflowAPI {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      let errMsg = `Database API Error: ${res.statusText}`;
      try {
        const json = await res.json();
        if (json.detail) errMsg = json.detail;
        else if (json.error) errMsg = json.error;
      } catch (e) {}
      throw new Error(errMsg);
    }
    return res.json() as Promise<T>;
  }

  async getEmployees(): Promise<Employee[]> {
    return this.request<Employee[]>("/api/employees");
  }

  async getEmployeeById(id: string): Promise<Employee> {
    return this.request<Employee>(`/api/employees/${id}`);
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    return this.request<Employee>(`/api/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async createEmployee(employee: Omit<Employee, "id">): Promise<Employee> {
    return this.request<Employee>("/api/employees", {
      method: "POST",
      body: JSON.stringify(employee),
    });
  }

  async getAttendanceRecords(employeeId?: string): Promise<AttendanceRecord[]> {
    const path = employeeId ? `/api/attendance?employee_id=${encodeURIComponent(employeeId)}` : "/api/attendance";
    return this.request<AttendanceRecord[]>(path);
  }

  async clockIn(employeeId: string, settings?: ClockSettings): Promise<AttendanceRecord> {
    return this.request<AttendanceRecord>("/api/attendance/clock", {
      method: "POST",
      body: JSON.stringify({ employee_id: employeeId, action: "check_in", settings }),
    });
  }

  async clockOut(employeeId: string, settings?: ClockSettings): Promise<AttendanceRecord> {
    return this.request<AttendanceRecord>("/api/attendance/clock", {
      method: "POST",
      body: JSON.stringify({ employee_id: employeeId, action: "check_out", settings }),
    });
  }

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    return this.request<LeaveRequest[]>("/api/timeoff/requests");
  }

  async applyLeave(request: Omit<LeaveRequest, "id" | "status" | "appliedDate">): Promise<LeaveRequest> {
    return this.request<LeaveRequest>("/api/timeoff/requests", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async reviewLeave(leaveId: string, status: "APPROVED" | "REJECTED", comments = ""): Promise<LeaveRequest> {
    return this.request<LeaveRequest>(`/api/timeoff/requests/${leaveId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, comments, reviewed_by: "HR Management" }),
    });
  }

  async getNotifications(userId: string): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>(`/api/notifications?user_id=${encodeURIComponent(userId)}`);
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request<{ status: string }>("/api/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.request<{ status: string }>("/api/notifications/mark-all-read", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    });
  }

  async getClockSettings(): Promise<ClockSettings> {
    return this.request<ClockSettings>("/api/clock-settings");
  }

  async saveClockSettings(settings: ClockSettings): Promise<ClockSettings> {
    return this.request<ClockSettings>("/api/clock-settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  async resetToSeedData(): Promise<void> {
    await this.request<{ status: string }>("/api/seed-database", {
      method: "POST",
    });
  }

  async loginUser(identifier: string, passwordHash?: string): Promise<Employee> {
    const res = await this.request<{ status: string; employee: Employee }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password: passwordHash }),
    });
    return res.employee;
  }
}

export const dayflowApi = new DayflowDatabaseRESTClient();

// ==========================================
// REGION 04 — UI PRIMITIVES
// ==========================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  const variants = {
    primary: "bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-sm active:scale-[0.98]",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-800 active:scale-[0.98]",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 shadow-xs active:scale-[0.98]",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-600 hover:text-gray-900",
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm active:scale-[0.98] focus-visible:ring-red-500",
    success: "bg-[#10B981] hover:bg-[#059669] text-white shadow-sm active:scale-[0.98] focus-visible:ring-emerald-500",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-5 py-2.5 gap-2.5",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <RefreshCw className="w-4 h-4 animate-spin mr-1" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-gray-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-xs">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "block w-full rounded-lg border bg-white text-gray-900 text-sm placeholder-gray-400 transition-colors focus:outline-none focus:ring-2",
              leftIcon ? "pl-9" : "pl-3.5",
              rightIcon ? "pr-9" : "pr-3.5",
              "py-2",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-[#4F46E5] focus:ring-[#4F46E5]/20",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightIcon}</div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600 flex items-center gap-1">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = "", id, ...props }) => {
  const selectId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, "-") : undefined);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "block w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20",
          error && "border-red-300 focus:border-red-500 focus:ring-red-200",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "brand" | "purple";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "neutral", size = "md", dot = false }) => {
  const styles = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
    info: "bg-blue-50 text-blue-800 border-blue-200",
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    brand: "bg-indigo-50 text-indigo-800 border-indigo-200",
    purple: "bg-purple-50 text-purple-800 border-purple-200",
  };

  const dotColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
    neutral: "bg-gray-400",
    brand: "bg-[#4F46E5]",
    purple: "bg-purple-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border select-none",
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        styles[variant]
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", dotColors[variant])} />}
      {children}
    </span>
  );
};

export interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "away";
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = "md", status }) => {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl font-bold",
  };

  const statusSizes = {
    sm: "w-2 h-2 bottom-0 right-0",
    md: "w-2.5 h-2.5 bottom-0 right-0",
    lg: "w-3 h-3 bottom-0.5 right-0.5",
    xl: "w-4 h-4 bottom-1 right-1",
  };

  const initials = useMemo(() => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [name]);

  return (
    <div className={cn("relative inline-block shrink-0 rounded-full select-none", sizes[size])}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full rounded-full object-cover ring-2 ring-white shadow-xs"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] text-white flex items-center justify-center font-semibold ring-2 ring-white shadow-xs">
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            "absolute rounded-full ring-2 ring-white",
            status === "online" && "bg-emerald-500",
            status === "offline" && "bg-gray-400",
            status === "busy" && "bg-red-500",
            status === "away" && "bg-amber-500",
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}> = ({ children, className = "", onClick, hoverEffect = false }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-xl border border-[#E5E7EB] shadow-xs transition-all duration-200 overflow-hidden",
        hoverEffect && "hover:shadow-md hover:border-gray-300 cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}> = ({ isOpen, onClose, title, description, children, footer, maxWidth = "md" }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150",
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 id="modal-title" className="text-base font-bold text-gray-900">{title}</h3>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// REGION 05 — GLOBAL STATE CONTEXT
// ==========================================

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

export interface HRMSState {
  currentRole: UserRole;
  currentUserId: string;
  activeTab: NavigationTab;
  isSidebarOpen: boolean;
  selectedEmployee: Employee | null;
  isApplyLeaveModalOpen: boolean;
  isAddEmployeeModalOpen: boolean;
  isProfileDrawerOpen: boolean;
  isClockSettingsModalOpen: boolean;
  clockSettings: ClockSettings;
  rejectModalTarget: ApprovalItem | null;
  searchQuery: string;
  toasts: ToastMessage[];
}

export type HRMSAction =
  | { type: "SET_ROLE"; payload: UserRole }
  | { type: "SET_USER"; payload: string }
  | { type: "SWITCH_ACCOUNT"; payload: { userId: string; role: UserRole } }
  | { type: "SET_TAB"; payload: NavigationTab }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR"; payload: boolean }
  | { type: "SELECT_EMPLOYEE"; payload: Employee | null }
  | { type: "OPEN_APPLY_LEAVE_MODAL"; payload: boolean }
  | { type: "OPEN_ADD_EMPLOYEE_MODAL"; payload: boolean }
  | { type: "OPEN_PROFILE_DRAWER"; payload: boolean }
  | { type: "OPEN_CLOCK_SETTINGS_MODAL"; payload: boolean }
  | { type: "UPDATE_CLOCK_SETTINGS"; payload: ClockSettings }
  | { type: "SET_REJECT_TARGET"; payload: ApprovalItem | null }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "ADD_TOAST"; payload: Omit<ToastMessage, "id"> }
  | { type: "REMOVE_TOAST"; payload: string };

const initialHRMSState: HRMSState = {
  currentRole: "ADMIN",
  currentUserId: "emp-001",
  activeTab: "dashboard",
  isSidebarOpen: false,
  selectedEmployee: null,
  isApplyLeaveModalOpen: false,
  isAddEmployeeModalOpen: false,
  isProfileDrawerOpen: false,
  isClockSettingsModalOpen: false,
  clockSettings: DEFAULT_CLOCK_SETTINGS,
  rejectModalTarget: null,
  searchQuery: "",
  toasts: [],
};

function hrmsReducer(state: HRMSState, action: HRMSAction): HRMSState {
  switch (action.type) {
    case "SET_ROLE":
      return {
        ...state,
        currentRole: action.payload,
        currentUserId: action.payload === "HR" ? "emp-002" : action.payload === "ADMIN" ? "emp-001" : "emp-003",
      };
    case "SET_USER":
      return { ...state, currentUserId: action.payload };
    case "SWITCH_ACCOUNT":
      return {
        ...state,
        currentUserId: action.payload.userId,
        currentRole: action.payload.role,
      };
    case "SET_TAB":
      return { ...state, activeTab: action.payload, isSidebarOpen: false };
    case "TOGGLE_SIDEBAR":
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case "SET_SIDEBAR":
      return { ...state, isSidebarOpen: action.payload };
    case "SELECT_EMPLOYEE":
      return {
        ...state,
        selectedEmployee: action.payload,
        isProfileDrawerOpen: Boolean(action.payload),
      };
    case "OPEN_APPLY_LEAVE_MODAL":
      return { ...state, isApplyLeaveModalOpen: action.payload };
    case "OPEN_ADD_EMPLOYEE_MODAL":
      return { ...state, isAddEmployeeModalOpen: action.payload };
    case "OPEN_PROFILE_DRAWER":
      return { ...state, isProfileDrawerOpen: action.payload };
    case "OPEN_CLOCK_SETTINGS_MODAL":
      return { ...state, isClockSettingsModalOpen: action.payload };
    case "UPDATE_CLOCK_SETTINGS":
      return { ...state, clockSettings: action.payload };
    case "SET_REJECT_TARGET":
      return { ...state, rejectModalTarget: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, { ...action.payload, id: `toast-${Date.now()}-${Math.random()}` }],
      };
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };
    default:
      return state;
  }
}

const HRMSContext = createContext<{
  state: HRMSState;
  dispatch: React.Dispatch<HRMSAction>;
} | null>(null);

export const HRMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(hrmsReducer, initialHRMSState);

  useEffect(() => {
    dayflowApi.getClockSettings().then((s) => {
      dispatch({ type: "UPDATE_CLOCK_SETTINGS", payload: s });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (state.toasts.length > 0) {
      const timer = setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", payload: state.toasts[0].id });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [state.toasts]);

  return <HRMSContext.Provider value={{ state, dispatch }}>{children}</HRMSContext.Provider>;
};

export const useHRMS = () => {
  const context = useContext(HRMSContext);
  if (!context) throw new Error("useHRMS must be used within an HRMSProvider");
  return context;
};

// ==========================================
// REGION 06 — DOMAIN COMPONENTS
// ==========================================

export const AdminAccountSwitcher: React.FC<{
  employees: Employee[];
  currentUserId: string;
  onSelectEmployee: (emp: Employee) => void;
}> = ({ employees, currentUserId, onSelectEmployee }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentEmp = employees.find((e) => e.id === currentUserId) || employees[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-700 text-xs font-bold transition-all shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-[#818CF8] cursor-pointer"
        title="Admin: Switch Controlled Member Account"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-gray-400 font-semibold">Active Member:</span>
        <span className="text-white font-extrabold flex items-center gap-1.5">
          {currentEmp?.firstName} {currentEmp?.lastName}
          <span className="text-[10px] bg-[#4F46E5] text-white px-1.5 py-0.2 rounded font-mono">
            {currentEmp?.role}
          </span>
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-700 z-50 p-2 animate-in fade-in zoom-in-95">
            <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Admin Managed Members (Database)
              </span>
              <span className="text-[10px] text-[#818CF8] font-mono">{employees.length} Accounts</span>
            </div>
            <div className="space-y-1 mt-1 max-h-64 overflow-y-auto">
              {employees.map((emp) => {
                const isCurrent = emp.id === currentUserId;
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onSelectEmployee(emp);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer text-xs",
                      isCurrent
                        ? "bg-[#4F46E5] text-white font-bold"
                        : "hover:bg-gray-800 text-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatarUrl} size="sm" />
                      <div className="truncate">
                        <p className="font-bold text-xs truncate">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[10px] opacity-70 truncate">{emp.designation}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-800/80 border border-gray-700">
                      {emp.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const ClockSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  settings: ClockSettings;
  onSave: (newSettings: ClockSettings) => void;
}> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<ClockSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attendance & Clock Settings (Database)"
      description="Configure shift timings, break deductions, and punch preferences stored in database."
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit}>
            Save to Database
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="shift-start"
            type="time"
            label="Shift Start Time"
            value={formData.shiftStartTime}
            onChange={(e) => setFormData({ ...formData, shiftStartTime: e.target.value })}
          />
          <Input
            id="shift-end"
            type="time"
            label="Shift End Time"
            value={formData.shiftEndTime}
            onChange={(e) => setFormData({ ...formData, shiftEndTime: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            id="break-duration"
            label="Default Break Duration"
            value={formData.breakDurationMinutes.toString()}
            onChange={(e) =>
              setFormData({ ...formData, breakDurationMinutes: parseInt(e.target.value, 10) })
            }
            options={[
              { label: "15 Minutes (Short)", value: "15" },
              { label: "30 Minutes (Standard)", value: "30" },
              { label: "45 Minutes (Lunch)", value: "45" },
              { label: "60 Minutes (Full Hour)", value: "60" },
            ]}
          />
          <Select
            id="work-location"
            label="Work Location Default"
            value={formData.workLocation}
            onChange={(e) =>
              setFormData({
                ...formData,
                workLocation: e.target.value as "Office (HQ)" | "Remote" | "Hybrid",
              })
            }
            options={[
              { label: "Office (HQ)", value: "Office (HQ)" },
              { label: "Remote", value: "Remote" },
              { label: "Hybrid", value: "Hybrid" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            id="time-format"
            label="Time Format"
            value={formData.timeFormat}
            onChange={(e) =>
              setFormData({ ...formData, timeFormat: e.target.value as "12h" | "24h" })
            }
            options={[
              { label: "12-Hour (09:00 AM/PM)", value: "12h" },
              { label: "24-Hour Military (09:00:00)", value: "24h" },
            ]}
          />
          <Input
            id="overtime-threshold"
            type="number"
            step="0.5"
            label="Overtime Threshold (Hours)"
            value={formData.overtimeThresholdHours.toString()}
            onChange={(e) =>
              setFormData({
                ...formData,
                overtimeThresholdHours: parseFloat(e.target.value) || 8.0,
              })
            }
          />
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={formData.autoClockOut}
              onChange={(e) => setFormData({ ...formData, autoClockOut: e.target.checked })}
              className="rounded text-[#4F46E5] focus:ring-[#4F46E5]"
            />
            <span>Enable Automated Clock-Out at End of Shift ({formData.shiftEndTime})</span>
          </label>
        </div>
      </form>
    </Modal>
  );
};

export const PunchClockWidget: React.FC<{
  currentRecord: AttendanceRecord | null;
  onClockIn: () => void;
  onClockOut: () => void;
  isLoading?: boolean;
  clockSettings?: ClockSettings;
  onOpenSettings?: () => void;
}> = ({
  currentRecord,
  onClockIn,
  onClockOut,
  isLoading,
  clockSettings = DEFAULT_CLOCK_SETTINGS,
  onOpenSettings,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const isClockedIn = Boolean(currentRecord?.clockInTime && !currentRecord?.clockOutTime);
  const isCompletedToday = Boolean(currentRecord?.clockInTime && currentRecord?.clockOutTime);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      if (clockSettings.timeFormat === "12h") {
        setCurrentTime(
          now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        );
      } else {
        setCurrentTime(
          now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          })
        );
      }
      setCurrentDate(
        now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [clockSettings.timeFormat]);

  useEffect(() => {
    if (!isClockedIn || !currentRecord?.clockInTime) {
      setElapsedSeconds(0);
      return;
    }
    const [h, m, s] = currentRecord.clockInTime.split(":").map(Number);
    const inDate = new Date();
    inDate.setHours(h, m, s || 0, 0);

    const updateTimer = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((now.getTime() - inDate.getTime()) / 1000));
      setElapsedSeconds(diff);
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [isClockedIn, currentRecord?.clockInTime]);

  const formatElapsed = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-5 border-l-4 border-l-[#4F46E5] bg-gradient-to-br from-white to-indigo-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
              isClockedIn
                ? "bg-emerald-100 text-emerald-600"
                : isCompletedToday
                ? "bg-blue-100 text-blue-600"
                : "bg-indigo-100 text-[#4F46E5]"
            )}
          >
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
                Database Shift Punch
              </span>
              <Badge
                variant={isClockedIn ? "success" : isCompletedToday ? "info" : "neutral"}
                size="sm"
                dot
              >
                {isClockedIn
                  ? "Active Shift (Database Live)"
                  : isCompletedToday
                  ? "Shift Logged in Database"
                  : "Not Clocked In"}
              </Badge>
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="p-1 text-gray-400 hover:text-[#4F46E5] hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                  title="Clock & Shift Settings"
                  aria-label="Open clock and shift settings"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-baseline gap-2 mt-0.5">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight font-mono">
                {currentTime || "--:--:--"}
              </h2>
              <span className="text-xs font-medium text-gray-500">{currentDate}</span>
            </div>

            {isClockedIn ? (
              <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Shift Elapsed: <strong className="font-mono">{formatElapsed(elapsedSeconds)}</strong>
                <span className="text-gray-400 text-[11px] ml-2">
                  (Started at {currentRecord?.clockInTime})
                </span>
              </p>
            ) : isCompletedToday ? (
              <p className="text-xs text-blue-700 font-medium mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 inline" />
                Today's Shift: <strong>{currentRecord?.totalWorkHours} hrs logged</strong> (
                {currentRecord?.clockInTime} → {currentRecord?.clockOutTime})
              </p>
            ) : (
              <p className="text-[11px] text-gray-500 mt-1">
                Scheduled Shift: {clockSettings.shiftStartTime} - {clockSettings.shiftEndTime} • {clockSettings.breakDurationMinutes}m break • {clockSettings.workLocation}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {!isClockedIn ? (
            <Button
              variant="success"
              size="lg"
              onClick={onClockIn}
              isLoading={isLoading}
              leftIcon={<Clock className="w-4 h-4" />}
            >
              {isCompletedToday ? "Clock In Again" : "Clock In Now"}
            </Button>
          ) : (
            <Button
              variant="danger"
              size="lg"
              onClick={onClockOut}
              isLoading={isLoading}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Clock Out ({formatElapsed(elapsedSeconds)})
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export const DashboardMetricCard: React.FC<{
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  colorClass?: string;
}> = ({ title, value, subtext, icon, trend, colorClass = "bg-indigo-100 text-[#4F46E5]" }) => {
  return (
    <Card className="p-5 hoverEffect">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-gray-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={cn("p-2.5 rounded-xl shrink-0 shadow-xs", colorClass)}>{icon}</div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>{subtext}</span>
        {trend && (
          <span
            className={cn(
              "font-bold flex items-center",
              trend.positive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
};

export const EmployeeCard: React.FC<{
  employee: Employee;
  onViewProfile: (emp: Employee) => void;
  onEdit?: (emp: Employee) => void;
  canEdit?: boolean;
}> = ({ employee, onViewProfile, onEdit, canEdit = false }) => {
  return (
    <Card className="p-5 hoverEffect flex flex-col justify-between h-full group border-gray-200">
      <div>
        <div className="flex items-start justify-between">
          <Avatar
            name={`${employee.firstName} ${employee.lastName}`}
            src={employee.avatarUrl}
            size="lg"
            status={employee.status === "ACTIVE" ? "online" : "offline"}
          />
          <Badge
            variant={
              employee.status === "ACTIVE"
                ? "success"
                : employee.status === "ON_LEAVE"
                ? "warning"
                : "neutral"
            }
            size="sm"
            dot
          >
            {employee.status.replace("_", " ")}
          </Badge>
        </div>

        <div className="mt-3.5">
          <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#4F46E5] transition-colors">
            {employee.firstName} {employee.lastName}
          </h4>
          <p className="text-xs text-gray-600 font-medium">{employee.designation}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{employee.department}</p>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-2 truncate">
            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{employee.workLocation}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] font-mono text-gray-400">{employee.employeeCode}</span>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => onViewProfile(employee)}>
            Profile
          </Button>
          {canEdit && onEdit && (
            <Button variant="secondary" size="sm" onClick={() => onEdit(employee)}>
              Edit
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export const LeaveBalanceCard: React.FC<{
  balances: Employee["leaveBalances"];
  onApplyClick: () => void;
}> = ({ balances, onApplyClick }) => {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Leave Allocations & Balances</h3>
          <p className="text-xs text-gray-500">Database quotas for fiscal year 2026</p>
        </div>
        <Button variant="primary" size="sm" onClick={onApplyClick} leftIcon={<Plus className="w-3.5 h-3.5" />}>
          Apply Leave
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-center">
          <p className="text-xs font-bold text-indigo-900">Paid Leave</p>
          <h4 className="text-2xl font-black text-[#4F46E5] mt-1">{balances.paid}</h4>
          <span className="text-[10px] text-indigo-700 font-medium">Days Available</span>
        </div>

        <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-100 text-center">
          <p className="text-xs font-bold text-amber-900">Sick Leave</p>
          <h4 className="text-2xl font-black text-amber-600 mt-1">{balances.sick}</h4>
          <span className="text-[10px] text-amber-700 font-medium">Days Available</span>
        </div>

        <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100 text-center">
          <p className="text-xs font-bold text-emerald-900">Casual Leave</p>
          <h4 className="text-2xl font-black text-emerald-600 mt-1">{balances.casual}</h4>
          <span className="text-[10px] text-emerald-700 font-medium">Days Available</span>
        </div>

        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-center">
          <p className="text-xs font-bold text-gray-700">Unpaid Leave</p>
          <h4 className="text-2xl font-black text-gray-700 mt-1">{balances.unpaid}</h4>
          <span className="text-[10px] text-gray-500 font-medium">Days Taken</span>
        </div>
      </div>
    </Card>
  );
};

export const ApprovalRow: React.FC<{
  item: ApprovalItem;
  onApprove: (id: string) => void;
  onReject: (item: ApprovalItem) => void;
  isProcessing?: boolean;
}> = ({ item, onApprove, onReject, isProcessing }) => {
  return (
    <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-gray-200">
      <div className="flex items-start gap-3.5">
        <Avatar name={item.employeeName} src={item.employeeAvatar} size="md" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm text-gray-900">{item.employeeName}</h4>
            <Badge variant="neutral" size="sm">
              {item.employeeRole}
            </Badge>
            <Badge
              variant={
                item.status === "APPROVED"
                  ? "success"
                  : item.status === "PENDING"
                  ? "warning"
                  : "danger"
              }
              size="sm"
              dot
            >
              {item.status}
            </Badge>
          </div>
          <p className="text-xs font-bold text-[#4F46E5] mt-1">{item.title}</p>
          <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{item.details}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
            <span>Period: <strong className="text-gray-600">{item.dateRange}</strong></span>
            <span>•</span>
            <span>Duration: <strong className="text-gray-600">{item.durationText}</strong></span>
            <span>•</span>
            <span>Submitted: {item.submittedAt}</span>
          </div>
        </div>
      </div>

      {item.status === "PENDING" ? (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReject(item)}
            disabled={isProcessing}
            leftIcon={<X className="w-3.5 h-3.5 text-red-600" />}
          >
            Decline
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={() => onApprove(item.id)}
            isLoading={isProcessing}
            leftIcon={<Check className="w-3.5 h-3.5" />}
          >
            Approve
          </Button>
        </div>
      ) : (
        <div className="text-xs font-semibold text-gray-500 self-end sm:self-center">
          Decision Saved in Database
        </div>
      )}
    </Card>
  );
};

// ==========================================
// REGION 07 — AUTHENTICATION & REGISTRATION
// ==========================================

export const AuthPageView: React.FC<{
  onAuthenticate: (employee: Employee) => void;
  employeesList: Employee[];
  onAccountCreated: (newEmp: Employee) => void;
}> = ({ onAuthenticate, employeesList, onAccountCreated }) => {
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "accounts">("signin");
  const [identifier, setIdentifier] = useState("evelyn.vance@dayflow.io");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Signup state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupEmpCode, setSignupEmpCode] = useState(`DF-${Math.floor(1000 + Math.random() * 9000)}`);
  const [signupRole, setSignupRole] = useState<UserRole>("EMPLOYEE");
  const [signupDept, setSignupDept] = useState("Engineering");
  const [signupDesignation, setSignupDesignation] = useState("Fullstack Engineer");
  const [signupLocation, setSignupLocation] = useState<"Office (HQ)" | "Remote" | "Hybrid">("Office (HQ)");
  const [signupAvatar, setSignupAvatar] = useState(
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"
  );
  const [signupPassword, setSignupPassword] = useState("Password123!");

  const avatarPresets = [
    { label: "Male Engineer", url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80" },
    { label: "Female Lead", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" },
    { label: "HR Specialist", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { label: "Designer", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const cleanId = identifier.trim();

    if (!cleanId) {
      setErrorMsg("Please enter your Employee Code (e.g. DF-1001) or Corporate Email.");
      return;
    }

    if (!isValidEmail(cleanId) && !isValidEmployeeCode(cleanId) && cleanId.length < 3) {
      setErrorMsg("Invalid identifier. Please provide a valid Work Email (name@domain.com) or Employee ID (DF-XXXX).");
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsLoading(true);
    try {
      const hashed = await hashPassword(password);
      const authenticatedEmp = await dayflowApi.loginUser(cleanId, hashed);
      setIsLoading(false);
      onAuthenticate(authenticatedEmp);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "Invalid credentials or employee not found in database.");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Please provide your full legal name.");
      return;
    }

    if (!isValidEmail(signupEmail)) {
      setErrorMsg("Please enter a valid corporate email address (e.g. name@dayflow.io).");
      return;
    }

    if (!isValidEmployeeCode(signupEmpCode)) {
      setErrorMsg("Employee ID must follow standard format (e.g. DF-1006).");
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters for security.");
      return;
    }

    setIsLoading(true);
    try {
      const hashed = await hashPassword(signupPassword);
      const newEmpData: Omit<Employee, "id"> = {
        employeeCode: signupEmpCode.toUpperCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: signupEmail.trim(),
        passwordHash: hashed,
        phone: "+1 (555) 019-2834",
        address: "HQ Campus, Tech Corridor",
        avatarUrl: signupAvatar,
        department: signupDept,
        designation: signupDesignation,
        role: signupRole,
        status: "ACTIVE",
        joiningDate: getLocalDateString(),
        managerName: signupRole === "ADMIN" ? "Board of Directors" : "Marcus Sterling",
        workLocation: signupLocation,
        salary: {
          basic: 6800,
          hra: 2700,
          specialAllowance: 1800,
          providentFund: 540,
          taxDeduction: 1200,
          currency: "USD",
        },
        leaveBalances: { paid: 18, sick: 10, casual: 5, unpaid: 0 },
        documents: [],
      };

      const created = await dayflowApi.createEmployee(newEmpData);
      onAccountCreated(created);
      setIsLoading(false);
      onAuthenticate(created);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || "Failed to create account in database.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#4F46E5]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#4F46E5] to-[#818CF8] text-white shadow-xl shadow-indigo-500/20 mb-3">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Dayflow HRMS</h1>
        <p className="text-sm text-gray-400 mt-1 flex items-center justify-center gap-1.5">
          <Database className="w-4 h-4 text-emerald-400" />
          Connected to Live Database Schema • Authentication & Onboarding
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-gray-900/95 border border-gray-800 backdrop-blur-md py-7 px-6 shadow-2xl rounded-3xl sm:px-8">
          <div className="flex border-b border-gray-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode("signin");
                setErrorMsg("");
              }}
              className={cn(
                "w-1/3 pb-3 text-xs font-extrabold border-b-2 text-center transition-all cursor-pointer",
                authMode === "signin"
                  ? "border-[#4F46E5] text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setErrorMsg("");
              }}
              className={cn(
                "w-1/3 pb-3 text-xs font-extrabold border-b-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1",
                authMode === "signup"
                  ? "border-[#4F46E5] text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              )}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("accounts");
                setErrorMsg("");
              }}
              className={cn(
                "w-1/3 pb-3 text-xs font-extrabold border-b-2 text-center transition-all cursor-pointer flex items-center justify-center gap-1",
                authMode === "accounts"
                  ? "border-[#4F46E5] text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              )}
            >
              <Users className="w-3.5 h-3.5 text-[#818CF8]" />
              Database Accounts ({employeesList.length})
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authMode === "signin" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="login-identifier" className="block text-xs font-semibold text-gray-300 mb-1">
                  Employee ID or Corporate Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="login-identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. DF-1001 or evelyn.vance@dayflow.io"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Valid Employee Code (e.g. <strong>DF-1001</strong>) or corporate email address.
                </p>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold text-gray-300 mb-1">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-gray-800 border-gray-700 text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                  <span>Remember active session</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("Password reset token dispatched to employee corporate address.")}
                  className="text-[#818CF8] hover:underline bg-transparent border-0 p-0 text-xs cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2 font-bold shadow-md"
              >
                Sign In (Verify Database)
              </Button>
            </form>
          )}

          {authMode === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-first-name" className="block text-xs font-semibold text-gray-300 mb-1">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="reg-first-name"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Alex"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
                <div>
                  <label htmlFor="reg-last-name" className="block text-xs font-semibold text-gray-300 mb-1">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="reg-last-name"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Morgan"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-300 mb-1">
                    Corporate Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="alex.morgan@dayflow.io"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
                <div>
                  <label htmlFor="reg-emp-code" className="block text-xs font-semibold text-gray-300 mb-1">
                    Employee ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="reg-emp-code"
                    type="text"
                    required
                    value={signupEmpCode}
                    onChange={(e) => setSignupEmpCode(e.target.value)}
                    placeholder="DF-1006"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="reg-role" className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Role Tier
                  </label>
                  <select
                    id="reg-role"
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="HR">HR Manager</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-dept" className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Department
                  </label>
                  <select
                    id="reg-dept"
                    value={signupDept}
                    onChange={(e) => setSignupDept(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product Design">Product Design</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Marketing & Growth">Marketing</option>
                    <option value="Finance & Legal">Finance</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-location" className="block text-[11px] font-semibold text-gray-300 mb-1">
                    Location
                  </label>
                  <select
                    id="reg-location"
                    value={signupLocation}
                    onChange={(e) => setSignupLocation(e.target.value as any)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  >
                    <option value="Office (HQ)">Office (HQ)</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="reg-designation" className="block text-xs font-semibold text-gray-300 mb-1">
                  Job Designation
                </label>
                <input
                  id="reg-designation"
                  type="text"
                  required
                  value={signupDesignation}
                  onChange={(e) => setSignupDesignation(e.target.value)}
                  placeholder="e.g. Senior Backend Architect"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Select Profile Portrait Photo:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {avatarPresets.map((preset) => (
                    <div
                      key={preset.url}
                      onClick={() => setSignupAvatar(preset.url)}
                      className={cn(
                        "p-1.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all bg-gray-800",
                        signupAvatar === preset.url
                          ? "border-[#4F46E5] ring-2 ring-[#4F46E5]/40"
                          : "border-gray-700 hover:border-gray-600 opacity-70 hover:opacity-100"
                      )}
                    >
                      <Avatar name={preset.label} src={preset.url} size="sm" />
                      <span className="text-[9px] text-gray-300 truncate w-full text-center">
                        {preset.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold text-gray-300 mb-1">
                  Security Password (SHA-256 Database Encryption) <span className="text-red-400">*</span>
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2 font-bold"
              >
                Save Account & Insert into Database
              </Button>
            </form>
          )}

          {authMode === "accounts" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-900/60 rounded-2xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#818CF8]" />
                  <h3 className="text-xs font-bold text-indigo-200">Database Member Accounts</h3>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Select any active member to authenticate directly against the database record.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {employeesList.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => onAuthenticate(emp)}
                    className="p-3 bg-gray-800/80 hover:bg-gray-800 border border-gray-700/70 hover:border-[#4F46E5] rounded-2xl flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] group shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatarUrl} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white group-hover:text-[#818CF8] transition-colors">
                            {emp.firstName} {emp.lastName}
                          </h4>
                          <span className="text-[10px] font-mono text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded">
                            {emp.employeeCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">{emp.designation}</p>
                        <p className="text-[10px] text-gray-500">{emp.department} • {emp.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          emp.role === "ADMIN" && "bg-purple-950 text-purple-300 border-purple-800",
                          emp.role === "HR" && "bg-emerald-950 text-emerald-300 border-emerald-800",
                          emp.role === "EMPLOYEE" && "bg-blue-950 text-blue-300 border-blue-800"
                        )}
                      >
                        {emp.role}
                      </span>
                      <Button variant="primary" size="sm" className="text-xs py-1 px-3">
                        Login →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 text-center text-[11px] text-gray-500 border-t border-gray-800/80 pt-4 flex items-center justify-center gap-1">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Synchronized directly with PostgreSQL database backend</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// REGION 08 — ROLE-TAILORED DASHBOARDS
// ==========================================

export const EmployeeDashboard: React.FC<{
  employee: Employee;
  attendance: AttendanceRecord[];
  todayRecord: AttendanceRecord | null;
  onClockIn: () => void;
  onClockOut: () => void;
  isPunching: boolean;
  clockSettings: ClockSettings;
}> = ({ employee, attendance, todayRecord, onClockIn, onClockOut, isPunching, clockSettings }) => {
  const { dispatch } = useHRMS();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center gap-4">
          <Avatar name={`${employee.firstName} ${employee.lastName}`} src={employee.avatarUrl} size="xl" status="online" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Good day, {employee.firstName}! 👋
              </h1>
              <Badge variant="brand" size="sm">Employee Workspace</Badge>
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-bold">
                {employee.employeeCode}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {employee.designation} • {employee.department} • Manager: {employee.managerName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "SET_TAB", payload: "attendance" })}
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            My Timesheet
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: true })}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Apply Leave
          </Button>
        </div>
      </div>

      <PunchClockWidget
        currentRecord={todayRecord}
        onClockIn={onClockIn}
        onClockOut={onClockOut}
        isLoading={isPunching}
        clockSettings={clockSettings}
        onOpenSettings={() => dispatch({ type: "OPEN_CLOCK_SETTINGS_MODAL", payload: true })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetricCard
          title="Weekly Worked Hours"
          value="38.5 hrs"
          subtext="Target: 40.0 hrs"
          icon={<Clock4 className="w-5 h-5 text-[#4F46E5]" />}
        />
        <DashboardMetricCard
          title="Paid Leaves Remaining"
          value={`${employee.leaveBalances.paid} Days`}
          subtext="Expires Dec 31, 2026"
          icon={<CalendarDays className="w-5 h-5 text-emerald-600 text-xs" />}
          colorClass="bg-emerald-100 text-emerald-600"
        />
        <DashboardMetricCard
          title="Sick Allowance"
          value={`${employee.leaveBalances.sick} Days`}
          subtext="Medical leave quota"
          icon={<Coffee className="w-5 h-5 text-amber-600 text-xs" />}
          colorClass="bg-amber-100 text-amber-600"
        />
        <DashboardMetricCard
          title="Monthly Net Pay"
          value={`$${(
            employee.salary.basic +
            employee.salary.hra +
            employee.salary.specialAllowance -
            (employee.salary.providentFund + employee.salary.taxDeduction)
          ).toLocaleString()}`}
          subtext="Direct deposit"
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          colorClass="bg-blue-100 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LeaveBalanceCard
            balances={employee.leaveBalances}
            onApplyClick={() => dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: true })}
          />

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">My Recent Shift Logs (Database)</h3>
                <p className="text-xs text-gray-500">Latest recorded attendance timestamps</p>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_TAB", payload: "attendance" })}
                className="text-xs font-semibold text-[#4F46E5] hover:underline cursor-pointer"
              >
                View Full Ledger →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Clock In</th>
                    <th className="pb-2.5">Clock Out</th>
                    <th className="pb-2.5">Work Hours</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {attendance
                    .filter((a) => a.employeeId === employee.id)
                    .slice(0, 4)
                    .map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-50/60">
                        <td className="py-2.5 font-medium text-gray-900">{rec.date}</td>
                        <td className="py-2.5 font-mono">{rec.clockInTime || "--:--"}</td>
                        <td className="py-2.5 font-mono">{rec.clockOutTime || "In Progress"}</td>
                        <td className="py-2.5 font-medium">{rec.totalWorkHours} hrs</td>
                        <td className="py-2.5">
                          <Badge
                            variant={
                              rec.status === "PRESENT"
                                ? "success"
                                : rec.status === "HALF_DAY"
                                ? "warning"
                                : "danger"
                            }
                            size="sm"
                            dot
                          >
                            {rec.status.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#4F46E5]" />
              Staff Announcements
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <p className="font-bold text-indigo-900">Upcoming Holiday: Labor Day</p>
                <p className="text-indigo-700 mt-0.5">Offices closed on Monday, Sept 7.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-bold text-gray-800">Q3 Town Hall</p>
                <p className="text-gray-600 mt-0.5">Thursday at 3:00 PM PST in Main Auditorium.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const HRDashboard: React.FC<{
  employee: Employee;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
}> = ({ employee, employees, attendance, leaves }) => {
  const { dispatch } = useHRMS();

  const pendingLeaves = useMemo(() => leaves.filter((l) => l.status === "PENDING"), [leaves]);
  const presentCount = useMemo(() => attendance.filter((a) => a.status === "PRESENT").length || 4, [attendance]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <Avatar name={`${employee.firstName} ${employee.lastName}`} src={employee.avatarUrl} size="xl" status="online" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                HR People Operations • {employee.firstName} {employee.lastName}
              </h1>
              <Badge variant="success" size="sm">HR Lead</Badge>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200 mt-1">
              Workforce Operations • Employee Onboarding & Leave Approval Authority
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="success"
            size="sm"
            onClick={() => dispatch({ type: "OPEN_ADD_EMPLOYEE_MODAL", payload: true })}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Onboard Employee
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "SET_TAB", payload: "approvals" })}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Review Approvals ({pendingLeaves.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetricCard
          title="Total Workforce"
          value={employees.length}
          subtext="Active company employees"
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          colorClass="bg-emerald-100 text-emerald-600"
          trend={{ value: "+2 this month", positive: true }}
        />
        <DashboardMetricCard
          title="Present On-Duty"
          value={presentCount}
          subtext="Active shift punches today"
          icon={<CheckCircle2 className="w-5 h-5 text-teal-600" />}
          colorClass="bg-teal-100 text-teal-600"
        />
        <DashboardMetricCard
          title="Pending Approvals"
          value={pendingLeaves.length}
          subtext="Requires HR review"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          colorClass="bg-amber-100 text-amber-600"
        />
        <DashboardMetricCard
          title="Departments Active"
          value="5"
          subtext="Engineering, Design, HR, Mktg"
          icon={<Building className="w-5 h-5 text-blue-600" />}
          colorClass="bg-blue-100 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Pending Leave Approvals Queue</h3>
                <p className="text-xs text-gray-500">Employee applications awaiting management decision</p>
              </div>
              <Badge variant="warning" size="sm">
                {pendingLeaves.length} Action Needed
              </Badge>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold">All pending leave applications cleared!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingLeaves.slice(0, 3).map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={l.employeeName} src={l.employeeAvatar} size="md" />
                      <div>
                        <p className="font-bold text-xs text-gray-900">{l.employeeName}</p>
                        <p className="text-[11px] text-gray-500">{l.leaveType} Leave • {l.totalDays} Days ({l.startDate} to {l.endDate})</p>
                        <p className="text-[10px] text-gray-400 italic mt-0.5">"{l.reason}"</p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => dispatch({ type: "SET_TAB", payload: "approvals" })}
                      className="text-xs"
                    >
                      Evaluate →
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              HR Quick Operations
            </h3>
            <div className="space-y-2.5 text-xs">
              <button
                type="button"
                onClick={() => dispatch({ type: "OPEN_ADD_EMPLOYEE_MODAL", payload: true })}
                className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 rounded-xl border border-emerald-200 font-bold text-left flex items-center justify-between cursor-pointer"
              >
                <span>+ Onboard New Staff</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_TAB", payload: "directory" })}
                className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-xl border border-gray-200 font-bold text-left flex items-center justify-between cursor-pointer"
              >
                <span>Manage Staff Directory</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_TAB", payload: "attendance" })}
                className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-xl border border-gray-200 font-bold text-left flex items-center justify-between cursor-pointer"
              >
                <span>Audit Team Attendance</span>
                <span>→</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC<{
  employee: Employee;
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
}> = ({ employee, employees, attendance, leaves }) => {
  const { dispatch } = useHRMS();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-950 via-gray-900 to-indigo-950 text-white p-6 rounded-2xl border border-gray-800 shadow-md">
        <div className="flex items-center gap-4">
          <Avatar name={`${employee.firstName} ${employee.lastName}`} src={employee.avatarUrl} size="xl" status="online" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                System Administration • {employee.firstName} {employee.lastName}
              </h1>
              <Badge variant="purple" size="sm">Super Admin</Badge>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Organization Governance • Multi-Account Controller • Biometric & Security Policy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => dispatch({ type: "OPEN_CLOCK_SETTINGS_MODAL", payload: true })}
            leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          >
            Clock & Shift Rules
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "OPEN_ADD_EMPLOYEE_MODAL", payload: true })}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetricCard
          title="Total Organization Staff"
          value={employees.length}
          subtext="Active accounts in database"
          icon={<Users className="w-5 h-5 text-[#4F46E5]" />}
          trend={{ value: "100% Synced", positive: true }}
        />
        <DashboardMetricCard
          title="Monthly Payroll Run"
          value="$32,500"
          subtext="Disbursed for August 2026"
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          colorClass="bg-emerald-100 text-emerald-600"
        />
        <DashboardMetricCard
          title="Active Shift Punches"
          value={attendance.filter((a) => a.status === "PRESENT").length || 4}
          subtext="Biometric live shifts"
          icon={<Activity className="w-5 h-5 text-indigo-600" />}
          colorClass="bg-indigo-100 text-[#4F46E5]"
        />
        <DashboardMetricCard
          title="Pending Approvals"
          value={leaves.filter((l) => l.status === "PENDING").length}
          subtext="Awaiting review"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          colorClass="bg-amber-100 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Organization Staff Roster</h3>
                <p className="text-xs text-gray-500">Direct account control and role assignments</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch({ type: "SET_TAB", payload: "directory" })}
              >
                Full Directory →
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Member</th>
                    <th className="px-4 py-2.5">Employee ID</th>
                    <th className="px-4 py-2.5">Department</th>
                    <th className="px-4 py-2.5">Role</th>
                    <th className="px-4 py-2.5 text-right">Switch Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {employees.slice(0, 5).map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/70">
                      <td className="px-4 py-3 flex items-center gap-2.5">
                        <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatarUrl} size="sm" />
                        <div>
                          <p className="font-bold text-gray-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[10px] text-gray-400">{emp.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600 font-bold">{emp.employeeCode}</td>
                      <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={emp.role === "ADMIN" ? "purple" : emp.role === "HR" ? "success" : "neutral"}
                          size="sm"
                        >
                          {emp.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            dispatch({ type: "SWITCH_ACCOUNT", payload: { userId: emp.id, role: emp.role } });
                            dispatch({
                              type: "ADD_TOAST",
                              payload: {
                                type: "info",
                                title: "Switched Account",
                                message: `Now controlling session for ${emp.firstName} ${emp.lastName} (${emp.role})`,
                              },
                            });
                          }}
                          className="text-xs"
                        >
                          Switch
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#4F46E5]" />
              System Governance
            </h3>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => dispatch({ type: "OPEN_CLOCK_SETTINGS_MODAL", payload: true })}
                className="w-full p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 rounded-xl border border-indigo-200 font-bold text-left flex items-center justify-between cursor-pointer"
              >
                <span>Configure Shift & Break Rules</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_TAB", payload: "payroll" })}
                className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-xl border border-gray-200 font-bold text-left flex items-center justify-between cursor-pointer"
              >
                <span>Executive Payroll Disbursement</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_TAB", payload: "settings" })}
                className="w-full p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-xl border border-gray-200 font-bold text-left flex items-center justify-between cursor-pointer"
              >
                <span>System Health & Data Reset</span>
                <span>→</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// REGION 09 — DIRECTORY, ATTENDANCE, LEAVES
// ==========================================

export const EmployeeDirectoryView: React.FC = () => {
  const { dispatch, state } = useHRMS();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isLoading, setIsLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await dayflowApi.getEmployees();
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const departments = useMemo(() => {
    return ["ALL", ...Array.from(new Set(employees.map((e) => e.department)))];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch =
        state.searchQuery === "" ||
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(state.searchQuery.toLowerCase());

      const matchDept = selectedDept === "ALL" || emp.department === selectedDept;
      const matchStatus = selectedStatus === "ALL" || emp.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, state.searchQuery, selectedDept, selectedStatus]);

  const isHRorAdmin = state.currentRole === "HR" || state.currentRole === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Employee Directory (Database)</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Discover colleagues, switch accounts, view role responsibilities, and manage employee profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer",
                viewMode === "grid" ? "bg-[#4F46E5] text-white" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer",
                viewMode === "table" ? "bg-[#4F46E5] text-white" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Table
            </button>
          </div>

          {isHRorAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => dispatch({ type: "OPEN_ADD_EMPLOYEE_MODAL", payload: true })}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Employee
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4 bg-white">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <Input
              id="employee-search-bar"
              placeholder="Search by name, employee code, role, or email..."
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })}
              leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDept(dept)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]",
                    selectedDept === dept
                      ? "bg-[#4F46E5] border-[#4F46E5] text-white shadow-xs"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {dept}
                </button>
              ))}
            </div>

            <Select
              id="employee-status-filter"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-36 text-xs"
              options={[
                { label: "All Statuses", value: "ALL" },
                { label: "Active", value: "ACTIVE" },
                { label: "On Leave", value: "ON_LEAVE" },
                { label: "Probation", value: "PROBATION" },
              ]}
            />
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No matching employees found in database</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or department filters.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <div key={emp.id} className="relative group/card">
              <EmployeeCard
                employee={emp}
                onViewProfile={(e) => dispatch({ type: "SELECT_EMPLOYEE", payload: e })}
                onEdit={(e) => dispatch({ type: "SELECT_EMPLOYEE", payload: e })}
                canEdit={isHRorAdmin}
              />
              <button
                type="button"
                onClick={() => {
                  dispatch({ type: "SWITCH_ACCOUNT", payload: { userId: emp.id, role: emp.role } });
                  dispatch({
                    type: "ADD_TOAST",
                    payload: {
                      type: "info",
                      title: "Account Switched",
                      message: `Now controlling session for ${emp.firstName} ${emp.lastName} (${emp.role})`,
                    },
                  });
                }}
                className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 bg-[#4F46E5] text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-all shadow-md hover:bg-[#4338CA] cursor-pointer"
                title="Switch Active Account to this Member"
              >
                Switch Account
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Designation</th>
                  <th className="px-5 py-3">Work Location</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatarUrl} size="md" />
                      <div>
                        <p className="font-bold text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono">{emp.employeeCode}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-900">{emp.department}</td>
                    <td className="px-5 py-3.5 text-gray-600">{emp.designation}</td>
                    <td className="px-5 py-3.5 text-gray-600">{emp.workLocation}</td>
                    <td className="px-5 py-3.5">
                      <Badge
                        variant={
                          emp.status === "ACTIVE"
                            ? "success"
                            : emp.status === "ON_LEAVE"
                            ? "warning"
                            : "neutral"
                        }
                        size="sm"
                        dot
                      >
                        {emp.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          dispatch({ type: "SWITCH_ACCOUNT", payload: { userId: emp.id, role: emp.role } });
                          dispatch({
                            type: "ADD_TOAST",
                            payload: {
                              type: "info",
                              title: "Account Switched",
                              message: `Switched session to ${emp.firstName} ${emp.lastName} (${emp.role})`,
                            },
                          });
                        }}
                        className="text-xs"
                      >
                        Switch
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dispatch({ type: "SELECT_EMPLOYEE", payload: emp })}
                        className="text-xs"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export const AttendanceView: React.FC = () => {
  const { state, dispatch } = useHRMS();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);

  const loadAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const isHRorAdmin = state.currentRole === "HR" || state.currentRole === "ADMIN";
      const records = await dayflowApi.getAttendanceRecords(
        isHRorAdmin ? undefined : state.currentUserId
      );
      setAttendance(records);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [state.currentRole, state.currentUserId]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const todayRecord = useMemo(() => {
    const today = getLocalDateString();
    return attendance.find((a) => a.employeeId === state.currentUserId && a.date === today) || null;
  }, [attendance, state.currentUserId]);

  const handleClockIn = async () => {
    setIsPunching(true);
    try {
      const rec = await dayflowApi.clockIn(state.currentUserId, state.clockSettings);
      dispatch({
        type: "ADD_TOAST",
        payload: {
          type: "success",
          title: "Clocked In Successfully",
          message: `Shift active in database since ${rec.clockInTime} • Location: ${rec.location || state.clockSettings.workLocation}`,
        },
      });
      await loadAttendance();
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Clock In Failed", message: err.message },
      });
    } finally {
      setIsPunching(false);
    }
  };

  const handleClockOut = async () => {
    setIsPunching(true);
    try {
      const rec = await dayflowApi.clockOut(state.currentUserId, state.clockSettings);
      dispatch({
        type: "ADD_TOAST",
        payload: {
          type: "info",
          title: "Clocked Out Successfully",
          message: `Shift logged to database at ${rec.clockOutTime} • Total: ${rec.totalWorkHours} hrs logged (${state.clockSettings.breakDurationMinutes}m break deducted)`,
        },
      });
      await loadAttendance();
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Clock Out Failed", message: err.message },
      });
    } finally {
      setIsPunching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Attendance & Timesheets (Database)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time biometric shift tracking, timesheet logs, and work hour auditing stored in database.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-3.5 h-3.5" />}
          onClick={() => {
            exportAttendanceCSV(attendance);
            dispatch({
              type: "ADD_TOAST",
              payload: {
                type: "success",
                title: "CSV Exported",
                message: "Downloaded attendance_logs_august_2026.csv from database records.",
              },
            });
          }}
        >
          Export Logs
        </Button>
      </div>

      <PunchClockWidget
        currentRecord={todayRecord}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        isLoading={isPunching}
        clockSettings={state.clockSettings}
        onOpenSettings={() => dispatch({ type: "OPEN_CLOCK_SETTINGS_MODAL", payload: true })}
      />

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Database Shift Records</h3>
            <p className="text-xs text-gray-500">Live records queried from backend schema</p>
          </div>
          <Badge variant="brand" size="sm">
            {attendance.length} Total Records
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-[#4F46E5] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Shift Window</th>
                  <th className="px-4 py-3">Clock In</th>
                  <th className="px-4 py-3">Clock Out</th>
                  <th className="px-4 py-3">Break Time</th>
                  <th className="px-4 py-3">Total Worked</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Location / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {attendance.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900">{row.date}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {state.clockSettings.shiftStartTime} - {state.clockSettings.shiftEndTime}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                      {row.clockInTime || "--:--:--"}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-700">
                      {row.clockOutTime || (row.clockInTime ? "Active Now" : "--:--:--")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{row.breakDurationMinutes} mins</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{row.totalWorkHours} hrs</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          row.status === "PRESENT"
                            ? "success"
                            : row.status === "HALF_DAY"
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                        dot
                      >
                        {row.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-[11px]">
                      {row.remarks || row.location || state.clockSettings.workLocation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export const LeaveManagementView: React.FC = () => {
  const { state, dispatch } = useHRMS();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLeaves = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leaveList, empList] = await Promise.all([
        dayflowApi.getLeaveRequests(),
        dayflowApi.getEmployees(),
      ]);
      setLeaves(leaveList);
      setEmployees(empList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves, state.currentUserId]);

  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === state.currentUserId) || employees[0];
  }, [employees, state.currentUserId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Leave & Time-Off Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Submit time-off requests, track balance quotas, and verify manager approvals saved in database.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: true })}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Apply for Leave
        </Button>
      </div>

      {currentEmployee && (
        <LeaveBalanceCard
          balances={currentEmployee.leaveBalances}
          onApplyClick={() => dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: true })}
        />
      )}

      <Card className="p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Database Leave Applications</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-[#4F46E5] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Date Range</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Applied Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reviewer Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {leaves.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-bold text-gray-900">{req.employeeName}</td>
                    <td className="px-4 py-3 font-bold text-[#4F46E5]">{req.leaveType} LEAVE</td>
                    <td className="px-4 py-3 font-medium">
                      {req.startDate} to {req.endDate}
                    </td>
                    <td className="px-4 py-3 font-bold">{req.totalDays} Days</td>
                    <td className="px-4 py-3 max-w-xs truncate text-gray-600">{req.reason}</td>
                    <td className="px-4 py-3 text-gray-400">{req.appliedDate}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          req.status === "APPROVED"
                            ? "success"
                            : req.status === "PENDING"
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                        dot
                      >
                        {req.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 italic">
                      {req.reviewerComments || (req.status === "PENDING" ? "Awaiting review" : "--")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export const ApprovalCenterView: React.FC = () => {
  const { dispatch } = useHRMS();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const list = await dayflowApi.getLeaveRequests();
    setLeaves(list);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      await dayflowApi.reviewLeave(id, "APPROVED", "Approved by HR Management.");
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "success", title: "Request Approved", message: "Leave decision committed to database." },
      });
      await loadData();
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Approval Failed", message: err.message },
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRejectPrompt = (item: ApprovalItem) => {
    dispatch({ type: "SET_REJECT_TARGET", payload: item });
  };

  const approvalItems: ApprovalItem[] = useMemo(() => {
    return leaves.map((l) => ({
      id: l.id,
      type: "LEAVE",
      referenceId: l.id,
      employeeId: l.employeeId,
      employeeName: l.employeeName,
      employeeAvatar: l.employeeAvatar,
      employeeRole: l.employeeDepartment,
      title: `${l.leaveType} Leave Request`,
      details: l.reason,
      dateRange: `${l.startDate} → ${l.endDate}`,
      durationText: `${l.totalDays} Days`,
      submittedAt: l.appliedDate,
      status: l.status,
      priority: l.totalDays >= 3 ? "HIGH" : "NORMAL",
    }));
  }, [leaves]);

  const filteredItems = useMemo(() => {
    return approvalItems.filter((item) => item.status === activeFilter);
  }, [approvalItems, activeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Approval Center (Database Synced)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review time-off applications and commit approvals directly to database.
          </p>
        </div>

        <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200">
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]",
                activeFilter === filter
                  ? "bg-white text-gray-900 shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {filter === "PENDING" && `Pending (${approvalItems.filter((i) => i.status === "PENDING").length})`}
              {filter === "APPROVED" && "Approved"}
              {filter === "REJECTED" && "Rejected"}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900">All caught up!</h3>
          <p className="text-xs text-gray-500 mt-1">
            No {activeFilter.toLowerCase()} approval requests in database.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ApprovalRow
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleRejectPrompt}
              isProcessing={isProcessing === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const PayrollView: React.FC = () => {
  const { state } = useHRMS();
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    dayflowApi.getEmployees().then(setEmployees);
  }, []);

  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === state.currentUserId) || employees[0];
  }, [employees, state.currentUserId]);

  if (!currentEmployee) return null;

  const { basic, hra, specialAllowance, providentFund, taxDeduction, currency } =
    currentEmployee.salary;
  const gross = basic + hra + specialAllowance;
  const deductions = providentFund + taxDeduction;
  const netTakeHome = gross - deductions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Payroll & Salary Statement (Database)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Salary structure and statutory deductions stored in database.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={() => window.print()}
        >
          Download Payslip PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900">
                August 2026 Payslip Statement — {currentEmployee.firstName} {currentEmployee.lastName}
              </h2>
              <p className="text-xs text-gray-500 font-mono">Statement Ref: PS-202608-{currentEmployee.employeeCode}</p>
            </div>
            <Badge variant="success" size="md" dot>
              Disbursed Aug 20, 2026
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider border-b border-gray-100 pb-1.5 text-emerald-800">
                Earnings (+)
              </h4>
              <div className="flex justify-between text-xs py-1">
                <span className="text-gray-600">Basic Salary</span>
                <span className="font-bold text-gray-900">${basic.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-gray-600">House Rent Allowance (HRA)</span>
                <span className="font-bold text-gray-900">${hra.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-gray-600">Special Allowance</span>
                <span className="font-bold text-gray-900">${specialAllowance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-gray-100 font-bold text-gray-900">
                <span>Gross Earnings</span>
                <span className="text-emerald-800 font-black">${gross.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider border-b border-gray-100 pb-1.5 text-red-800">
                Deductions (-)
              </h4>
              <div className="flex justify-between text-xs py-1">
                <span className="text-gray-600">Provident Fund (PF)</span>
                <span className="font-bold text-gray-900">${providentFund.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-gray-600">Income Tax Withholding (TDS)</span>
                <span className="font-bold text-gray-900">${taxDeduction.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-gray-100 font-bold text-gray-900">
                <span>Total Deductions</span>
                <span className="text-red-800 font-black">${deductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-indigo-900">Net Take-Home Pay</p>
              <p className="text-[11px] text-indigo-700">Directly deposited to bank account on file</p>
            </div>
            <h3 className="text-2xl font-black text-[#4F46E5]">
              ${netTakeHome.toLocaleString()} {currency}
            </h3>
          </div>
        </Card>

        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Disbursement Account Details</h3>
          <div className="space-y-2.5 text-xs text-gray-600">
            <div>
              <p className="text-gray-400 text-[11px]">Beneficiary Name</p>
              <p className="font-bold text-gray-800">
                {currentEmployee.firstName} {currentEmployee.lastName}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px]">Depository Bank</p>
              <p className="font-bold text-gray-800">Apex National Bank, N.A.</p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px]">Account Number (Masked)</p>
              <p className="font-mono text-gray-800 font-bold">•••• •••• •••• 8842</p>
            </div>
            <div>
              <p className="text-gray-400 text-[11px]">Tax ID / SSN</p>
              <p className="font-mono text-gray-800">TAX-US-991204</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const { state, dispatch } = useHRMS();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  const handleSaveClockSettings = async (newSettings: ClockSettings) => {
    await dayflowApi.saveClockSettings(newSettings);
    dispatch({ type: "UPDATE_CLOCK_SETTINGS", payload: newSettings });
    dispatch({
      type: "ADD_TOAST",
      payload: {
        type: "success",
        title: "Clock Settings Saved to Database",
        message: `Shift: ${newSettings.shiftStartTime} - ${newSettings.shiftEndTime} • Break: ${newSettings.breakDurationMinutes}m`,
      },
    });
  };

  const handleResetData = async () => {
    if (!window.confirm("Are you sure you want to reset database data back to factory seed values?")) return;
    setIsResetting(true);
    await dayflowApi.resetToSeedData();
    setIsResetting(false);
    dispatch({
      type: "ADD_TOAST",
      payload: { type: "success", title: "Database Reset Done", message: "Database restored to initial seed state." },
    });
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">System & Account Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure shift timings, attendance parameters, notification alerts, and database state.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4F46E5]" />
              Work Shift & Attendance Timers (Database)
            </h3>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              onClick={() => dispatch({ type: "OPEN_CLOCK_SETTINGS_MODAL", payload: true })}
            >
              Modify Shift Rules
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-400 font-semibold">Standard Shift Window</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {state.clockSettings.shiftStartTime} - {state.clockSettings.shiftEndTime}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">9.0 Hours Total Window</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-400 font-semibold">Break Allowance</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {state.clockSettings.breakDurationMinutes} Minutes
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Deducted from Shift Worktime</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-400 font-semibold">Display Format & Location</p>
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                {state.clockSettings.timeFormat === "12h" ? "12-Hour AM/PM" : "24-Hour Military"}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">{state.clockSettings.workLocation}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4 border-l-4 border-l-amber-500">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            Database Factory Reset
          </h3>
          <p className="text-xs text-gray-600">
            Clear all database records (leaves, attendance, newly registered staff) and restore initial schema seed data.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetData}
            isLoading={isResetting}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            className="border-amber-300 text-amber-800 hover:bg-amber-50"
          >
            Reset Database to Seed State
          </Button>
        </Card>
      </div>
    </div>
  );
};

export const EmployeeProfileDrawer: React.FC = () => {
  const { state, dispatch } = useHRMS();
  const emp = state.selectedEmployee;
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (emp) {
      setPhone(emp.phone);
      setAddress(emp.address);
    }
  }, [emp]);

  if (!state.isProfileDrawerOpen || !emp) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dayflowApi.updateEmployee(emp.id, { phone, address });
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "success", title: "Profile Updated", message: "Contact details committed to database." },
      });
      dispatch({ type: "OPEN_PROFILE_DRAWER", payload: false });
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Update Failed", message: err.message },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => dispatch({ type: "OPEN_PROFILE_DRAWER", payload: false })}
      />
      <div className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-right duration-200">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between bg-gray-50">
          <div className="flex items-center gap-4">
            <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatarUrl} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">
                  {emp.firstName} {emp.lastName}
                </h2>
                <Badge variant="brand" size="sm">
                  {emp.role}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 font-medium">{emp.designation}</p>
              <p className="text-xs text-gray-400 font-mono mt-0.5">{emp.employeeCode}</p>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: "OPEN_PROFILE_DRAWER", payload: false })}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
            aria-label="Close profile drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <Input
            id="drawer-phone"
            label="Primary Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            id="drawer-address"
            label="Residential Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Input id="drawer-email" label="Email Address" value={emp.email} disabled helperText="Managed in database" />
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "OPEN_PROFILE_DRAWER", payload: false })}
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}>
            Save to Database
          </Button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// REGION 10 — MASTER APPLICATION SHELL
// ==========================================

export const HRMSApplication: React.FC = () => {
  const { state, dispatch } = useHRMS();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("dayflow_authenticated_session") === "true";
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isPunching, setIsPunching] = useState(false);

  // Leave form
  const [leaveType, setLeaveType] = useState<LeaveType>("PAID");
  const [startDate, setStartDate] = useState("2026-08-25");
  const [endDate, setEndDate] = useState("2026-08-26");
  const [leaveReason, setLeaveReason] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Add employee form
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDepartment, setNewDepartment] = useState("Engineering");
  const [newDesignation, setNewDesignation] = useState("Software Engineer");
  const [newRole, setNewRole] = useState<UserRole>("EMPLOYEE");
  const [newSalary, setNewSalary] = useState("6500");
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  // Reject modal
  const [rejectReason, setRejectReason] = useState("");

  // Notification state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Pull all data directly from the Database API
  const loadDatabaseData = useCallback(async () => {
    try {
      const [empList, attList, leaveList, notifList] = await Promise.all([
        dayflowApi.getEmployees(),
        dayflowApi.getAttendanceRecords(),
        dayflowApi.getLeaveRequests(),
        dayflowApi.getNotifications(state.currentUserId),
      ]);
      setEmployees(empList);
      setAttendance(attList);
      setLeaves(leaveList);
      setNotifications(notifList);
    } catch (e) {
      console.error("Database sync error:", e);
    }
  }, [state.currentUserId]);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData, isAuthenticated, state.currentUserId]);

  const activeEmployee = useMemo(() => {
    return employees.find((e) => e.id === state.currentUserId) || employees[0];
  }, [employees, state.currentUserId]);

  const todayRecord = useMemo(() => {
    const today = getLocalDateString();
    return attendance.find((a) => a.employeeId === activeEmployee?.id && a.date === today) || null;
  }, [attendance, activeEmployee?.id]);

  const unreadNotifCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const handleUserLogin = (emp: Employee) => {
    localStorage.setItem("dayflow_authenticated_session", "true");
    dispatch({ type: "SWITCH_ACCOUNT", payload: { userId: emp.id, role: emp.role } });
    dispatch({ type: "SET_TAB", payload: "dashboard" });
    setIsAuthenticated(true);
    dispatch({
      type: "ADD_TOAST",
      payload: {
        type: "success",
        title: "Database Session Active",
        message: `Signed in as ${emp.firstName} ${emp.lastName} (${emp.role}) • Code: ${emp.employeeCode}`,
      },
    });
  };

  const handleUserSignOut = () => {
    localStorage.removeItem("dayflow_authenticated_session");
    setIsAuthenticated(false);
    dispatch({
      type: "ADD_TOAST",
      payload: {
        type: "info",
        title: "Signed Out",
        message: "Your database session has ended.",
      },
    });
  };

  const handleSwitchMember = (emp: Employee) => {
    dispatch({ type: "SWITCH_ACCOUNT", payload: { userId: emp.id, role: emp.role } });
    dispatch({
      type: "ADD_TOAST",
      payload: {
        type: "success",
        title: "Database Context Switched",
        message: `Switched session to ${emp.firstName} ${emp.lastName} (${emp.role})`,
      },
    });
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    await dayflowApi.markNotificationRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
    );
    if (notif.targetTab) {
      dispatch({ type: "SET_TAB", payload: notif.targetTab });
    }
    setIsNotifOpen(false);
  };

  const handleMarkAllNotificationsRead = async () => {
    await dayflowApi.markAllNotificationsRead(state.currentUserId);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    dispatch({
      type: "ADD_TOAST",
      payload: {
        type: "info",
        title: "Database Updated",
        message: "All notifications marked as read. Indicator off.",
      },
    });
  };

  const handleClockIn = async () => {
    if (!activeEmployee) return;
    setIsPunching(true);
    try {
      const rec = await dayflowApi.clockIn(activeEmployee.id, state.clockSettings);
      dispatch({
        type: "ADD_TOAST",
        payload: {
          type: "success",
          title: "Clock In Committed to Database",
          message: `Shift started at ${rec.clockInTime} for ${activeEmployee.firstName}`,
        },
      });
      await loadDatabaseData();
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Clock In Failed", message: err.message },
      });
    } finally {
      setIsPunching(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeEmployee) return;
    setIsPunching(true);
    try {
      const rec = await dayflowApi.clockOut(activeEmployee.id, state.clockSettings);
      dispatch({
        type: "ADD_TOAST",
        payload: {
          type: "info",
          title: "Clock Out Committed to Database",
          message: `Shift finished at ${rec.clockOutTime} • Total: ${rec.totalWorkHours} hrs`,
        },
      });
      await loadDatabaseData();
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Clock Out Failed", message: err.message },
      });
    } finally {
      setIsPunching(false);
    }
  };

  const handleApplyLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Validation Error", message: "Please provide a reason for leave." },
      });
      return;
    }

    setIsSubmittingLeave(true);
    try {
      await dayflowApi.applyLeave({
        employeeId: activeEmployee.id,
        employeeName: `${activeEmployee.firstName} ${activeEmployee.lastName}`,
        employeeAvatar: activeEmployee.avatarUrl,
        employeeDepartment: activeEmployee.department,
        leaveType,
        startDate,
        endDate,
        totalDays: 2,
        isHalfDay: false,
        reason: leaveReason,
      });

      dispatch({
        type: "ADD_TOAST",
        payload: {
          type: "success",
          title: "Leave Inserted into Database",
          message: "Application is pending HR review.",
        },
      });
      dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: false });
      setLeaveReason("");
      await loadDatabaseData();
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Submission Failed", message: err.message },
      });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName || !newEmail) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Validation Error", message: "Please fill in all mandatory fields." },
      });
      return;
    }

    setIsAddingEmployee(true);
    try {
      const basicNum = parseFloat(newSalary) || 6000;
      await dayflowApi.createEmployee({
        employeeCode: `DF-${Math.floor(1000 + Math.random() * 9000)}`,
        firstName: newFirstName,
        lastName: newLastName,
        email: newEmail,
        passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        phone: newPhone || "+1 (555) 012-3456",
        address: "HQ Campus, Tech Hub",
        avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
        department: newDepartment,
        designation: newDesignation,
        role: newRole,
        status: "ACTIVE",
        joiningDate: getLocalDateString(),
        managerName: "Marcus Sterling",
        workLocation: "Office (HQ)",
        salary: {
          basic: basicNum,
          hra: Math.round(basicNum * 0.4),
          specialAllowance: Math.round(basicNum * 0.25),
          providentFund: Math.round(basicNum * 0.12),
          taxDeduction: Math.round(basicNum * 0.18),
          currency: "USD",
        },
        leaveBalances: { paid: 18, sick: 10, casual: 5, unpaid: 0 },
        documents: [],
      });

      dispatch({
        type: "ADD_TOAST",
        payload: {
          type: "success",
          title: "Employee Inserted into Database",
          message: `${newFirstName} ${newLastName} record committed to database.`,
        },
      });

      dispatch({ type: "OPEN_ADD_EMPLOYEE_MODAL", payload: false });
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPhone("");
      await loadDatabaseData();
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Creation Failed", message: err.message },
      });
    } finally {
      setIsAddingEmployee(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!state.rejectModalTarget) return;
    if (!rejectReason.trim()) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Validation Error", message: "Please provide a reason for declining." },
      });
      return;
    }
    try {
      await dayflowApi.reviewLeave(
        state.rejectModalTarget.referenceId,
        "REJECTED",
        rejectReason.trim()
      );
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "info", title: "Request Declined in Database", message: "Employee record updated." },
      });
      dispatch({ type: "SET_REJECT_TARGET", payload: null });
      setRejectReason("");
      await loadDatabaseData();
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Action Failed", message: err.message },
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <AuthPageView
        onAuthenticate={handleUserLogin}
        employeesList={employees}
        onAccountCreated={(newEmp) => setEmployees((prev) => [newEmp, ...prev])}
      />
    );
  }

  const getNavItemsForRole = (role: UserRole) => {
    if (role === "EMPLOYEE") {
      return [
        { id: "dashboard" as NavigationTab, label: "My Workspace", icon: <Layers className="w-4 h-4" /> },
        { id: "attendance" as NavigationTab, label: "My Timesheet", icon: <Clock className="w-4 h-4" /> },
        { id: "leaves" as NavigationTab, label: "My Leaves & Time-Off", icon: <Calendar className="w-4 h-4" /> },
        { id: "payroll" as NavigationTab, label: "My Salary & Payslip", icon: <DollarSign className="w-4 h-4" /> },
        { id: "settings" as NavigationTab, label: "My Preferences", icon: <Settings className="w-4 h-4" /> },
      ];
    }
    if (role === "HR") {
      return [
        { id: "dashboard" as NavigationTab, label: "HR Operations Hub", icon: <Briefcase className="w-4 h-4" /> },
        { id: "directory" as NavigationTab, label: "Staff Directory", icon: <Users className="w-4 h-4" /> },
        { id: "attendance" as NavigationTab, label: "Team Attendance Logs", icon: <Clock className="w-4 h-4" /> },
        { id: "approvals" as NavigationTab, label: "Leave Approval Center", icon: <CheckSquare className="w-4 h-4" /> },
        { id: "leaves" as NavigationTab, label: "Company Calendar", icon: <Calendar className="w-4 h-4" /> },
        { id: "settings" as NavigationTab, label: "HR Settings", icon: <Settings className="w-4 h-4" /> },
      ];
    }
    return [
      { id: "dashboard" as NavigationTab, label: "Admin Console", icon: <Shield className="w-4 h-4" /> },
      { id: "directory" as NavigationTab, label: "Workforce Directory", icon: <Users className="w-4 h-4" /> },
      { id: "attendance" as NavigationTab, label: "Biometric Timesheets", icon: <Clock className="w-4 h-4" /> },
      { id: "approvals" as NavigationTab, label: "Executive Approvals", icon: <CheckSquare className="w-4 h-4" /> },
      { id: "payroll" as NavigationTab, label: "Payroll Management", icon: <DollarSign className="w-4 h-4" /> },
      { id: "leaves" as NavigationTab, label: "Time-Off Schedules", icon: <Calendar className="w-4 h-4" /> },
      { id: "settings" as NavigationTab, label: "System & Biometrics", icon: <Settings className="w-4 h-4" /> },
    ];
  };

  const navItems = getNavItemsForRole(state.currentRole);

  if (!activeEmployee) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col antialiased text-[#111827]">
      {/* Top Bar with Admin Multi-Account Switcher */}
      <div className="bg-gray-900 text-white px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-gray-800 z-30">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="font-black tracking-wide text-gray-200">DAYFLOW DATABASE HRMS</span>
          <span className="text-gray-500 hidden md:inline">•</span>
          <span className="text-gray-300 font-medium hidden md:inline">
            Active Session: <strong className="text-white font-extrabold">{activeEmployee.firstName} {activeEmployee.lastName}</strong> ({activeEmployee.role})
          </span>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <AdminAccountSwitcher
            employees={employees}
            currentUserId={state.currentUserId}
            onSelectEmployee={handleSwitchMember}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {state.isSidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/50 z-30 lg:hidden"
            onClick={() => dispatch({ type: "SET_SIDEBAR", payload: false })}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-gray-300 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
            state.isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div>
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4F46E5] text-white flex items-center justify-center font-black shadow-md">
                  D
                </div>
                <div>
                  <span className="text-base font-black text-white tracking-tight block">Dayflow HRMS</span>
                  <span className="text-[10px] text-gray-400 uppercase font-mono font-bold">
                    {state.currentRole} View
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                className="lg:hidden text-gray-400 hover:text-white p-1"
                aria-label="Close sidebar navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4 space-y-1.5" aria-label="Main Navigation">
              {navItems.map((item) => {
                const isActive = state.activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => dispatch({ type: "SET_TAB", payload: item.id })}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]",
                      isActive
                        ? "bg-[#4F46E5] text-white shadow-sm"
                        : "text-gray-400 hover:text-white hover:bg-gray-800"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              <Avatar
                name={`${activeEmployee.firstName} ${activeEmployee.lastName}`}
                src={activeEmployee.avatarUrl}
                size="sm"
                status="online"
              />
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate">
                  {activeEmployee.firstName} {activeEmployee.lastName}
                </p>
                <p className="text-[10px] text-gray-400 truncate font-mono">
                  {activeEmployee.role} • {activeEmployee.employeeCode}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleUserSignOut}
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded-lg cursor-pointer shrink-0"
              title="Sign Out to Login Page"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Content Container */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <header className="h-16 bg-white border-b border-[#E5E7EB] px-4 sm:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
                aria-label="Open sidebar menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900 capitalize">
                  {state.activeTab.replace("-", " ")}
                </h2>
                <Badge
                  variant={
                    state.currentRole === "ADMIN" ? "purple" : state.currentRole === "HR" ? "success" : "brand"
                  }
                  size="sm"
                >
                  {state.currentRole} UI
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3 relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]"
                aria-label="View notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#4F46E5] text-white text-[10px] font-black border-2 border-white animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 top-12 w-88 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 p-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-900">Database Notifications</h4>
                        <p className="text-[10px] text-gray-500">
                          {unreadNotifCount > 0 ? `${unreadNotifCount} unread alert(s)` : "All alerts visited (Indicator OFF)"}
                        </p>
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllNotificationsRead}
                          className="text-[11px] font-bold text-[#4F46E5] hover:underline cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto text-xs pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">No notifications found.</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={cn(
                              "p-3 rounded-xl border transition-all cursor-pointer group flex items-start gap-2.5",
                              n.isRead
                                ? "bg-white border-gray-100 text-gray-600 hover:bg-gray-50 opacity-75"
                                : "bg-indigo-50/70 border-indigo-200 text-indigo-950 font-medium hover:bg-indigo-100 shadow-xs"
                            )}
                          >
                            <div className="mt-0.5 shrink-0">
                              {n.type === "SUCCESS" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                              {n.type === "WARNING" && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                              {n.type === "INFO" && <Sparkles className="w-4 h-4 text-[#4F46E5]" />}
                              {n.type === "ACTION_REQUIRED" && <Clock className="w-4 h-4 text-red-600" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-bold text-xs text-gray-900 group-hover:text-[#4F46E5]">
                                  {n.title}
                                </p>
                                <span
                                  className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.2 rounded uppercase",
                                    n.isRead ? "bg-gray-100 text-gray-500" : "bg-[#4F46E5] text-white"
                                  )}
                                >
                                  {n.isRead ? "Visited" : "New"}
                                </span>
                              </div>
                              <p className="text-[11px] opacity-90 mt-0.5">{n.message}</p>
                              <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                                <span>{n.timestamp}</span>
                                {n.targetTab && (
                                  <span className="text-[#4F46E5] font-semibold group-hover:underline">
                                    Click to Visit →
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
                <Avatar
                  name={`${activeEmployee.firstName} ${activeEmployee.lastName}`}
                  src={activeEmployee.avatarUrl}
                  size="md"
                />
                <div className="text-left">
                  <p className="text-xs font-black text-gray-900">
                    {activeEmployee.firstName} {activeEmployee.lastName}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {activeEmployee.designation} • {activeEmployee.department}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto">
            {state.activeTab === "dashboard" && (
              state.currentRole === "EMPLOYEE" ? (
                <EmployeeDashboard
                  employee={activeEmployee}
                  attendance={attendance}
                  todayRecord={todayRecord}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                  isPunching={isPunching}
                  clockSettings={state.clockSettings}
                />
              ) : state.currentRole === "HR" ? (
                <HRDashboard
                  employee={activeEmployee}
                  employees={employees}
                  attendance={attendance}
                  leaves={leaves}
                />
              ) : (
                <AdminDashboard
                  employee={activeEmployee}
                  employees={employees}
                  attendance={attendance}
                  leaves={leaves}
                />
              )
            )}

            {state.activeTab === "directory" && <EmployeeDirectoryView />}
            {state.activeTab === "attendance" && <AttendanceView />}
            {state.activeTab === "leaves" && <LeaveManagementView />}
            {state.activeTab === "approvals" && <ApprovalCenterView />}
            {state.activeTab === "payroll" && <PayrollView />}
            {state.activeTab === "settings" && <SettingsView />}
          </div>
        </main>
      </div>

      <EmployeeProfileDrawer />

      <ClockSettingsModal
        isOpen={state.isClockSettingsModalOpen}
        onClose={() => dispatch({ type: "OPEN_CLOCK_SETTINGS_MODAL", payload: false })}
        settings={state.clockSettings}
        onSave={async (newSettings) => {
          await dayflowApi.saveClockSettings(newSettings);
          dispatch({ type: "UPDATE_CLOCK_SETTINGS", payload: newSettings });
          dispatch({
            type: "ADD_TOAST",
            payload: {
              type: "success",
              title: "Clock Settings Committed",
              message: `Shift: ${newSettings.shiftStartTime} - ${newSettings.shiftEndTime} saved in database.`,
            },
          });
        }}
      />

      <Modal
        isOpen={state.isAddEmployeeModalOpen}
        onClose={() => dispatch({ type: "OPEN_ADD_EMPLOYEE_MODAL", payload: false })}
        title="Add New Employee (Insert to Database)"
        description="Onboard a new employee directly into the PostgreSQL database."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: "OPEN_ADD_EMPLOYEE_MODAL", payload: false })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isAddingEmployee}
              onClick={handleAddEmployeeSubmit}
            >
              Commit to Database
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleAddEmployeeSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="emp-first-name"
              label="First Name"
              required
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
              placeholder="e.g. Alex"
            />
            <Input
              id="emp-last-name"
              label="Last Name"
              required
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
              placeholder="e.g. Morgan"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="emp-email"
              type="email"
              label="Corporate Email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="alex.morgan@dayflow.io"
            />
            <Input
              id="emp-phone"
              label="Phone Number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+1 (555) 012-3456"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="emp-dept-select"
              label="Department"
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              options={[
                { label: "Engineering", value: "Engineering" },
                { label: "Product Design", value: "Product Design" },
                { label: "Human Resources", value: "Human Resources" },
                { label: "Marketing & Growth", value: "Marketing & Growth" },
                { label: "Finance & Legal", value: "Finance & Legal" },
              ]}
            />
            <Input
              id="emp-designation"
              label="Job Designation"
              required
              value={newDesignation}
              onChange={(e) => setNewDesignation(e.target.value)}
              placeholder="e.g. Fullstack Engineer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              id="emp-role-select"
              label="Access Role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              options={[
                { label: "Employee", value: "EMPLOYEE" },
                { label: "HR Manager", value: "HR" },
                { label: "Admin", value: "ADMIN" },
              ]}
            />
            <Input
              id="emp-salary"
              type="number"
              label="Monthly Basic Salary ($)"
              required
              value={newSalary}
              onChange={(e) => setNewSalary(e.target.value)}
              placeholder="6500"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={state.isApplyLeaveModalOpen}
        onClose={() => dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: false })}
        title="Apply for Time-Off / Leave (Database)"
        description="Submit your leave application directly into the database."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: false })}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmittingLeave}
              onClick={handleApplyLeaveSubmit}
            >
              Submit to Database
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleApplyLeaveSubmit}>
          <Select
            id="leave-type-select"
            label="Leave Category"
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            options={[
              { label: "Paid Leave (Vacation)", value: "PAID" },
              { label: "Sick Leave (Medical)", value: "SICK" },
              { label: "Casual Leave", value: "CASUAL" },
              { label: "Unpaid Leave", value: "UNPAID" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="leave-start-date"
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              id="leave-end-date"
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="leave-reason-textarea" className="block text-xs font-semibold text-gray-700 mb-1.5">
              Reason / Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              id="leave-reason-textarea"
              required
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Please provide details about your leave request..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(state.rejectModalTarget)}
        onClose={() => dispatch({ type: "SET_REJECT_TARGET", payload: null })}
        title="Decline Approval Request"
        description="Provide a formal justification for declining this request."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch({ type: "SET_REJECT_TARGET", payload: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleRejectConfirm}>
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-600">
            You are rejecting request for <strong>{state.rejectModalTarget?.employeeName}</strong> (
            {state.rejectModalTarget?.title}).
          </p>
          <div>
            <label htmlFor="reject-reason-input" className="block text-xs font-semibold text-gray-700 mb-1">
              Decline Reason
            </label>
            <textarea
              id="reject-reason-input"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this request is declined..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
          </div>
        </div>
      </Modal>

      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {state.toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "p-4 rounded-xl shadow-lg border pointer-events-auto flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 bg-white",
              toast.type === "success" && "border-emerald-200 bg-emerald-50/90 text-emerald-950",
              toast.type === "error" && "border-red-200 bg-red-50/90 text-red-950",
              toast.type === "info" && "border-indigo-200 bg-indigo-50/90 text-indigo-950",
              toast.type === "warning" && "border-amber-200 bg-amber-50/90 text-amber-950"
            )}
          >
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toast.type === "error" && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
            {toast.type === "info" && <Sparkles className="w-5 h-5 text-[#4F46E5] shrink-0" />}
            {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
            <div className="flex-1">
              <h5 className="text-xs font-bold">{toast.title}</h5>
              <p className="text-[11px] opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: "REMOVE_TOAST", payload: toast.id })}
              className="opacity-50 hover:opacity-100"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export function calculateWorkHours(
  clockIn: string | null,
  clockOut: string | null,
  breakMinutes = 0
): number {
  if (!clockIn || !clockOut) return 0;
  const [inH, inM, inS = 0] = clockIn.split(":").map(Number);
  const [outH, outM, outS = 0] = clockOut.split(":").map(Number);
  
  const inTotalMins = inH * 60 + inM + inS / 60;
  const outTotalMins = outH * 60 + outM + outS / 60;
  
  const grossMinutes = outTotalMins - inTotalMins;
  const netMinutes = Math.max(0, grossMinutes - breakMinutes);
  
  return parseFloat((netMinutes / 60).toFixed(2));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function getLeaveDaysCount(startDate: string, endDate: string, isHalfDay = false): number {
  if (isHalfDay) return 0.5;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

export function filterEmployees(
  employees: Employee[],
  query = "",
  department = "ALL",
  status = "ALL"
): Employee[] {
  return employees.filter((emp) => {
    const matchSearch =
      query === "" ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
      emp.email.toLowerCase().includes(query.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(query.toLowerCase()) ||
      emp.designation.toLowerCase().includes(query.toLowerCase());

    const matchDept = department === "ALL" || emp.department === department;
    const matchStatus = status === "ALL" || emp.status === status;

    return matchSearch && matchDept && matchStatus;
  });
}

export function exportAttendanceCSV(records: AttendanceRecord[], filename = "dayflow_attendance_logs_august_2026.csv"): void {
  const headers = ["Record ID", "Employee ID", "Date", "Clock In", "Clock Out", "Break (Mins)", "Total Hours", "Status", "Location / Remarks"];
  const rows = records.map((r) => [
    r.id,
    r.employeeId,
    r.date,
    r.clockInTime || "--:--",
    r.clockOutTime || "Active Shift",
    r.breakDurationMinutes,
    r.totalWorkHours,
    r.status,
    `"${(r.remarks || r.location || "Office HQ").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const DashboardView = EmployeeDashboard;

export default function App() {
  return (
    <HRMSProvider>
      <HRMSApplication />
    </HRMSProvider>
  );
}
