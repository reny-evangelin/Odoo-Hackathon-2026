/**
 * ============================================================================
 * DAYFLOW — HUMAN RESOURCE MANAGEMENT SYSTEM (HRMS)
 * "Every workday, perfectly aligned."
 * 
 * ARCHITECTURE: Compressed Cathedral Master File (12 Regions)
 * AUTHOR: Senior Frontend Architect & Technical Lead
 * 
 * TEAM OWNERSHIP MAP:
 * REGION 01-02 → Frontend Lead (Architecture, Tokens & System Contracts)
 * REGION 03    → UI/System Owner (Primitive UI Vocabulary)
 * REGION 04    → Domain Feature Owners (Domain Business Components)
 * REGION 05-06 → Integration Owner (Query Hooks & Typed API Contracts)
 * REGION 07    → State Owner (Zustand Global State & Local Reducers)
 * REGION 08-09 → Page/UX Owner (Page Compositions & Application Shell)
 * REGION 10-11 → QA Owner (Accessibility, Responsiveness & Testable Pure Utils)
 * REGION 12    → Engineering Lead (Handoff Ledger & Verification Artifacts)
 * 
 * Inviolable Rule: Do not modify outside your assigned territory without
 * an approved architectural implementation plan.
 * ============================================================================
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
  useRef,
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
  TrendingUp,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Settings,
  User,
  Shield,
  Briefcase,
  Building,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Check,
  X,
  Eye,
  EyeOff,
  MoreVertical,
  Download,
  Upload,
  RefreshCw,
  Layers,
  Menu,
  Sun,
  Moon,
  Sparkles,
  HelpCircle,
  ArrowUpRight,
  BarChart3,
  Clock4,
  Coffee,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";

// ============================================================
// REGION 01 — CONFIGURATION & GLOBAL TYPES
// ============================================================

export type UserRole = "EMPLOYEE" | "HR" | "ADMIN";

export type AttendanceStatusType = "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE" | "WEEKEND";

export type LeaveType = "PAID" | "SICK" | "CASUAL" | "UNPAID";

export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "TERMINATED" | "PROBATION";

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
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
  date: string; // YYYY-MM-DD
  clockInTime: string | null; // HH:mm:ss
  clockOutTime: string | null; // HH:mm:ss
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
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
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

export interface PayrollSummary {
  month: string; // YYYY-MM
  employeeId: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  grossSalary: number;
  pfDeduction: number;
  taxDeduction: number;
  totalDeductions: number;
  netPayable: number;
  paymentStatus: "PAID" | "PROCESSING" | "PENDING";
  paymentDate?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ACTION_REQUIRED";
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface DashboardMetrics {
  totalEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  pendingApprovals: number;
  monthlyPayrollTotal: number;
  weeklyAttendanceRate: number;
}

export type NavigationTab =
  | "dashboard"
  | "directory"
  | "attendance"
  | "leaves"
  | "approvals"
  | "payroll"
  | "profile"
  | "settings";

// ============================================================
// REGION 02 — DESIGN TOKENS
// ============================================================

export const TOKENS = {
  colors: {
    brand: {
      50: "#F5F3FF",
      100: "#EDE9FE",
      200: "#DDD6FE",
      300: "#C4B5FD",
      400: "#A78BFA",
      500: "#8B5CF6",
      600: "#7C3AED", // Primary Accent (Dayflow Purple)
      700: "#6D28D9",
      800: "#5B21B6",
      900: "#4C1D95",
    },
    surface: {
      canvas: "#F8FAFC",
      card: "#FFFFFF",
      cardHover: "#F8FAFC",
      border: "#E2E8F0",
      borderSubtle: "#F1F5F9",
      inputBg: "#FFFFFF",
      sidebar: "#0F172A",
      sidebarHover: "#1E293B",
      sidebarActive: "#7C3AED",
    },
    text: {
      primary: "#0F172A",
      secondary: "#334155",
      muted: "#64748B",
      inverted: "#FFFFFF",
      link: "#7C3AED",
    },
    status: {
      present: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0", dot: "#10B981" },
      absent: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA", dot: "#EF4444" },
      halfDay: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A", dot: "#F59E0B" },
      onLeave: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE", dot: "#3B82F6" },
      pending: { bg: "#FFFBEB", text: "#B45309", border: "#FCD34D", dot: "#F59E0B" },
      approved: { bg: "#ECFDF5", text: "#047857", border: "#6EE7B7", dot: "#10B981" },
      rejected: { bg: "#FEF2F2", text: "#B91C1C", border: "#FCA5A5", dot: "#EF4444" },
    },
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  },
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },
} as const;

// Helper to concatenate class names cleanly
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ============================================================
// REGION 03 — PRIMITIVE UI VOCABULARY
// ============================================================

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
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer";

  const variants = {
    primary:
      "bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-sm focus:ring-[#7C3AED] active:scale-[0.98]",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 active:scale-[0.98]",
    outline:
      "border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm focus:ring-[#7C3AED]",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-400",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500 active:scale-[0.98]",
    success:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500 active:scale-[0.98]",
  };

  const sizes = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5",
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
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
            {label}
            {props.required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "block w-full rounded-lg border bg-white text-slate-900 text-sm placeholder-slate-400 transition-colors focus:outline-none focus:ring-2",
              leftIcon ? "pl-9" : "pl-3.5",
              rightIcon ? "pr-9" : "pr-3.5",
              "py-2",
              error
                ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                : "border-slate-200 focus:border-[#7C3AED] focus:ring-[#7C3AED]/20",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{rightIcon}</div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}
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

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className = "",
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20",
          error && "border-rose-300 focus:border-rose-500 focus:ring-rose-200",
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
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
};

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "brand";
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
}) => {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-cyan-50 text-cyan-700 border-cyan-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    brand: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const dotColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-cyan-500",
    neutral: "bg-slate-400",
    brand: "bg-[#7C3AED]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
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

  // Generate deterministic gradient based on name
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
          className="w-full h-full rounded-full object-cover ring-2 ring-white shadow-sm"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] text-white flex items-center justify-center font-semibold ring-2 ring-white shadow-sm">
          {initials}
        </div>
      )}
      {status && (
        <span
          className={cn(
            "absolute rounded-full ring-2 ring-white",
            status === "online" && "bg-emerald-500",
            status === "offline" && "bg-slate-400",
            status === "busy" && "bg-rose-500",
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
        "bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all duration-200 overflow-hidden",
        hoverEffect && "hover:shadow-md hover:border-slate-300 cursor-pointer",
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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150",
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// REGION 04 — DOMAIN COMPONENTS
// ============================================================

export const RoleSwitcherPill: React.FC<{
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}> = ({ currentRole, onRoleChange }) => {
  return (
    <div className="inline-flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700/80 shadow-inner">
      <span className="text-[11px] font-semibold text-slate-400 px-2.5 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#A78BFA]" />
        <span className="hidden sm:inline">Demo Role:</span>
      </span>
      {(["EMPLOYEE", "HR", "ADMIN"] as UserRole[]).map((r) => {
        const isActive = currentRole === r;
        return (
          <button
            key={r}
            onClick={() => onRoleChange(r)}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer",
              isActive
                ? "bg-[#7C3AED] text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            )}
          >
            {r === "EMPLOYEE" && "Employee"}
            {r === "HR" && "HR Officer"}
            {r === "ADMIN" && "Admin"}
          </button>
        );
      })}
    </div>
  );
};

export const PunchClockWidget: React.FC<{
  currentRecord: AttendanceRecord | null;
  onClockIn: () => void;
  onClockOut: () => void;
  isLoading?: boolean;
}> = ({ currentRecord, onClockIn, onClockOut, isLoading }) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const isClockedIn = Boolean(currentRecord?.clockInTime && !currentRecord?.clockOutTime);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute live elapsed work timer if clocked in
  useEffect(() => {
    if (!isClockedIn || !currentRecord?.clockInTime) {
      setElapsedSeconds(0);
      return;
    }
    const [h, m, s] = currentRecord.clockInTime.split(":").map(Number);
    const inDate = new Date();
    inDate.setHours(h, m, s, 0);

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
    <Card className="p-5 border-l-4 border-l-[#7C3AED] bg-gradient-to-br from-white to-purple-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
              isClockedIn ? "bg-emerald-100 text-emerald-600" : "bg-purple-100 text-[#7C3AED]"
            )}
          >
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Attendance Punch
              </span>
              <Badge variant={isClockedIn ? "success" : "neutral"} size="sm" dot>
                {isClockedIn ? "Active Shift" : "Not Clocked In"}
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {currentTime || "--:--:--"}
              </h2>
              <span className="text-xs font-medium text-slate-500">{currentDate}</span>
            </div>
            {isClockedIn && (
              <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Shift Elapsed: <strong className="font-mono">{formatElapsed(elapsedSeconds)}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {!isClockedIn ? (
            <Button
              variant="primary"
              size="lg"
              onClick={onClockIn}
              isLoading={isLoading}
              leftIcon={<Clock className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 font-semibold"
            >
              Clock In Now
            </Button>
          ) : (
            <Button
              variant="danger"
              size="lg"
              onClick={onClockOut}
              isLoading={isLoading}
              leftIcon={<LogOut className="w-4 h-4" />}
              className="font-semibold"
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
}> = ({ title, value, subtext, icon, trend, colorClass = "bg-purple-100 text-[#7C3AED]" }) => {
  return (
    <Card className="p-5 hoverEffect">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        <div className={cn("p-2.5 rounded-xl shrink-0 shadow-xs", colorClass)}>{icon}</div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{subtext}</span>
        {trend && (
          <span
            className={cn(
              "font-semibold flex items-center",
              trend.positive ? "text-emerald-600" : "text-rose-600"
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
    <Card className="p-5 hoverEffect flex flex-col justify-between h-full group border-slate-200">
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
          <h4 className="text-base font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors">
            {employee.firstName} {employee.lastName}
          </h4>
          <p className="text-xs font-medium text-slate-500">{employee.designation}</p>
          <p className="text-xs text-slate-400 font-mono mt-0.5">{employee.employeeCode}</p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{employee.department}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{employee.workLocation}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewProfile(employee)}
          className="w-full text-xs"
        >
          View Profile
        </Button>
        {canEdit && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(employee)}
            className="text-xs px-2.5 text-slate-600 hover:text-[#7C3AED]"
          >
            Edit
          </Button>
        )}
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
          <h3 className="text-sm font-bold text-slate-900">Leave Balances</h3>
          <p className="text-xs text-slate-500">Accrued time-off for current calendar year</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onApplyClick}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Apply Leave
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
          <p className="text-[11px] font-semibold text-purple-700 uppercase">Paid Leave</p>
          <p className="text-2xl font-black text-purple-900 mt-1">{balances.paid}</p>
          <p className="text-[10px] text-purple-600 mt-0.5">Days available</p>
        </div>
        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100">
          <p className="text-[11px] font-semibold text-amber-700 uppercase">Sick Leave</p>
          <p className="text-2xl font-black text-amber-900 mt-1">{balances.sick}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">Days available</p>
        </div>
        <div className="p-3 rounded-xl bg-cyan-50/60 border border-cyan-100">
          <p className="text-[11px] font-semibold text-cyan-700 uppercase">Casual Leave</p>
          <p className="text-2xl font-black text-cyan-900 mt-1">{balances.casual}</p>
          <p className="text-[10px] text-cyan-600 mt-0.5">Days available</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-[11px] font-semibold text-slate-600 uppercase">Unpaid Used</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{balances.unpaid}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Days taken</p>
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
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <Avatar name={item.employeeName} src={item.employeeAvatar} size="md" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-slate-900">{item.employeeName}</h4>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 font-medium">{item.employeeRole}</span>
            <Badge
              variant={
                item.priority === "URGENT"
                  ? "danger"
                  : item.priority === "HIGH"
                  ? "warning"
                  : "neutral"
              }
              size="sm"
            >
              {item.priority}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-purple-700 mt-0.5">{item.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Dates: <strong className="text-slate-700">{item.dateRange}</strong> ({item.durationText}
            )
          </p>
          <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
            "{item.details}"
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onReject(item)}
          disabled={isProcessing}
          className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
          leftIcon={<X className="w-3.5 h-3.5" />}
        >
          Reject
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
    </div>
  );
};

// ============================================================
// REGION 05 & 06 — FEATURE LOGIC, HOOKS & TYPED API CONTRACTS
// ============================================================

// INITIAL SEED DATABASE (Dayflow Enterprise Realistic Dataset)
export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp-001",
    employeeCode: "DF-1001",
    firstName: "Evelyn",
    lastName: "Vance",
    email: "evelyn.vance@dayflow.io",
    phone: "+1 (555) 234-5678",
    address: "742 Evergreen Terrace, San Francisco, CA",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    department: "Engineering",
    designation: "Lead Frontend Architect",
    role: "ADMIN",
    status: "ACTIVE",
    joiningDate: "2022-03-15",
    managerName: "Chief Technology Officer",
    workLocation: "Hybrid",
    salary: {
      basic: 7500,
      hra: 3000,
      specialAllowance: 2000,
      providentFund: 600,
      taxDeduction: 1400,
      currency: "USD",
    },
    leaveBalances: { paid: 14, sick: 7, casual: 4, unpaid: 0 },
    documents: [
      { id: "doc-1", name: "Employment_Agreement.pdf", type: "PDF", uploadDate: "2022-03-15", size: "2.4 MB" },
      { id: "doc-2", name: "Tax_Form_W2_2025.pdf", type: "PDF", uploadDate: "2025-01-10", size: "1.1 MB" },
    ],
  },
  {
    id: "emp-002",
    employeeCode: "DF-1002",
    firstName: "Marcus",
    lastName: "Sterling",
    email: "marcus.sterling@dayflow.io",
    phone: "+1 (555) 345-6789",
    address: "128 Market Street, Austin, TX",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    department: "Human Resources",
    designation: "Senior HR Business Partner",
    role: "HR",
    status: "ACTIVE",
    joiningDate: "2023-01-10",
    managerName: "VP of People Operations",
    workLocation: "Office (HQ)",
    salary: {
      basic: 6000,
      hra: 2400,
      specialAllowance: 1600,
      providentFund: 500,
      taxDeduction: 1100,
      currency: "USD",
    },
    leaveBalances: { paid: 18, sick: 10, casual: 5, unpaid: 0 },
    documents: [
      { id: "doc-3", name: "HR_Certification.pdf", type: "PDF", uploadDate: "2023-01-10", size: "850 KB" },
    ],
  },
  {
    id: "emp-003",
    employeeCode: "DF-1003",
    firstName: "Sophia",
    lastName: "Chen",
    email: "sophia.chen@dayflow.io",
    phone: "+1 (555) 456-7890",
    address: "550 Broadway, New York, NY",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    department: "Product Design",
    designation: "Senior Product Designer",
    role: "EMPLOYEE",
    status: "ACTIVE",
    joiningDate: "2023-06-01",
    managerName: "Design Director",
    workLocation: "Remote",
    salary: {
      basic: 6500,
      hra: 2600,
      specialAllowance: 1800,
      providentFund: 550,
      taxDeduction: 1250,
      currency: "USD",
    },
    leaveBalances: { paid: 12, sick: 6, casual: 3, unpaid: 1 },
    documents: [
      { id: "doc-4", name: "Design_Contract.pdf", type: "PDF", uploadDate: "2023-06-01", size: "1.8 MB" },
    ],
  },
  {
    id: "emp-004",
    employeeCode: "DF-1004",
    firstName: "Julian",
    lastName: "Alvarez",
    email: "julian.alvarez@dayflow.io",
    phone: "+1 (555) 567-8901",
    address: "310 King St, Seattle, WA",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    department: "Engineering",
    designation: "Fullstack Cloud Engineer",
    role: "EMPLOYEE",
    status: "ACTIVE",
    joiningDate: "2023-09-15",
    managerName: "Evelyn Vance",
    workLocation: "Hybrid",
    salary: {
      basic: 5800,
      hra: 2200,
      specialAllowance: 1400,
      providentFund: 480,
      taxDeduction: 980,
      currency: "USD",
    },
    leaveBalances: { paid: 16, sick: 8, casual: 5, unpaid: 0 },
    documents: [],
  },
  {
    id: "emp-005",
    employeeCode: "DF-1005",
    firstName: "Aria",
    lastName: "Montgomery",
    email: "aria.montgomery@dayflow.io",
    phone: "+1 (555) 678-9012",
    address: "902 Rosewood Blvd, Boston, MA",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    department: "Marketing & Growth",
    designation: "Director of Product Marketing",
    role: "EMPLOYEE",
    status: "ON_LEAVE",
    joiningDate: "2021-11-20",
    managerName: "Chief Marketing Officer",
    workLocation: "Office (HQ)",
    salary: {
      basic: 7200,
      hra: 2800,
      specialAllowance: 2200,
      providentFund: 620,
      taxDeduction: 1380,
      currency: "USD",
    },
    leaveBalances: { paid: 5, sick: 4, casual: 2, unpaid: 0 },
    documents: [],
  },
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: "att-101",
    employeeId: "emp-001",
    date: "2026-08-22",
    clockInTime: "08:58:14",
    clockOutTime: null,
    breakDurationMinutes: 0,
    totalWorkHours: 0,
    status: "PRESENT",
    location: "SF HQ - Floor 4",
  },
  {
    id: "att-102",
    employeeId: "emp-001",
    date: "2026-08-21",
    clockInTime: "09:02:00",
    clockOutTime: "17:45:00",
    breakDurationMinutes: 45,
    totalWorkHours: 7.95,
    status: "PRESENT",
    location: "SF HQ - Floor 4",
  },
  {
    id: "att-103",
    employeeId: "emp-001",
    date: "2026-08-20",
    clockInTime: "09:15:00",
    clockOutTime: "18:00:00",
    breakDurationMinutes: 60,
    totalWorkHours: 7.75,
    status: "PRESENT",
    location: "Remote",
  },
  {
    id: "att-104",
    employeeId: "emp-001",
    date: "2026-08-19",
    clockInTime: "09:00:00",
    clockOutTime: "13:30:00",
    breakDurationMinutes: 15,
    totalWorkHours: 4.25,
    status: "HALF_DAY",
    remarks: "Medical Appointment in Afternoon",
    location: "SF HQ",
  },
  {
    id: "att-105",
    employeeId: "emp-003",
    date: "2026-08-22",
    clockInTime: "09:30:00",
    clockOutTime: null,
    breakDurationMinutes: 0,
    totalWorkHours: 0,
    status: "PRESENT",
    location: "Remote - NYC",
  },
];

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: "leave-201",
    employeeId: "emp-003",
    employeeName: "Sophia Chen",
    employeeAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    employeeDepartment: "Product Design",
    leaveType: "PAID",
    startDate: "2026-08-28",
    endDate: "2026-08-30",
    totalDays: 3,
    isHalfDay: false,
    reason: "Attending Figma Config design conference and UX workshops.",
    status: "PENDING",
    appliedDate: "2026-08-20",
  },
  {
    id: "leave-202",
    employeeId: "emp-004",
    employeeName: "Julian Alvarez",
    employeeAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    employeeDepartment: "Engineering",
    leaveType: "SICK",
    startDate: "2026-08-24",
    endDate: "2026-08-25",
    totalDays: 2,
    isHalfDay: false,
    reason: "Scheduled dental surgery and recovery.",
    status: "PENDING",
    appliedDate: "2026-08-21",
  },
  {
    id: "leave-203",
    employeeId: "emp-005",
    employeeName: "Aria Montgomery",
    employeeAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    employeeDepartment: "Marketing & Growth",
    leaveType: "PAID",
    startDate: "2026-08-18",
    endDate: "2026-08-23",
    totalDays: 5,
    isHalfDay: false,
    reason: "Annual family summer vacation.",
    status: "APPROVED",
    appliedDate: "2026-08-01",
    reviewerName: "Marcus Sterling",
    reviewedDate: "2026-08-03",
    reviewerComments: "Approved. Team coverage arranged.",
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    userId: "emp-001",
    title: "Leave Request Approved",
    message: "Your casual leave request for Aug 15 has been approved by HR.",
    type: "SUCCESS",
    timestamp: "2 hours ago",
    isRead: false,
  },
  {
    id: "notif-2",
    userId: "emp-001",
    title: "Payroll Statement Generated",
    message: "August 2026 payslip is now available for review and download.",
    type: "INFO",
    timestamp: "1 day ago",
    isRead: true,
  },
  {
    id: "notif-3",
    userId: "emp-001",
    title: "Team Clock-In Reminder",
    message: "Please ensure all weekly timesheets are submitted by Friday 5 PM.",
    type: "WARNING",
    timestamp: "2 days ago",
    isRead: true,
  },
];

// TYPED API CLIENT CONTRACTS
export interface IDayflowAPI {
  getEmployees: () => Promise<Employee[]>;
  getEmployeeById: (id: string) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<Employee>;
  createEmployee: (employee: Omit<Employee, "id">) => Promise<Employee>;
  getAttendanceRecords: (employeeId?: string) => Promise<AttendanceRecord[]>;
  clockIn: (employeeId: string) => Promise<AttendanceRecord>;
  clockOut: (employeeId: string) => Promise<AttendanceRecord>;
  getLeaveRequests: () => Promise<LeaveRequest[]>;
  applyLeave: (request: Omit<LeaveRequest, "id" | "status" | "appliedDate">) => Promise<LeaveRequest>;
  reviewLeave: (leaveId: string, status: "APPROVED" | "REJECTED", comments?: string) => Promise<LeaveRequest>;
  getNotifications: (userId: string) => Promise<NotificationItem[]>;
  markNotificationRead: (id: string) => Promise<void>;
}

// IN-MEMORY SIMULATED BACKEND ENGINE
class DayflowMockBackendEngine implements IDayflowAPI {
  private employees: Employee[] = [...INITIAL_EMPLOYEES];
  private attendance: AttendanceRecord[] = [...INITIAL_ATTENDANCE];
  private leaves: LeaveRequest[] = [...INITIAL_LEAVE_REQUESTS];
  private notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];

  async getEmployees(): Promise<Employee[]> {
    await new Promise((r) => setTimeout(r, 120));
    return [...this.employees];
  }

  async getEmployeeById(id: string): Promise<Employee> {
    await new Promise((r) => setTimeout(r, 80));
    const emp = this.employees.find((e) => e.id === id);
    if (!emp) throw new Error("Employee not found");
    return { ...emp };
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee> {
    await new Promise((r) => setTimeout(r, 150));
    const idx = this.employees.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Employee not found");
    this.employees[idx] = { ...this.employees[idx], ...updates };
    return { ...this.employees[idx] };
  }

  async createEmployee(empData: Omit<Employee, "id">): Promise<Employee> {
    await new Promise((r) => setTimeout(r, 200));
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now().toString().slice(-4)}`,
    };
    this.employees.unshift(newEmp);
    return newEmp;
  }

  async getAttendanceRecords(employeeId?: string): Promise<AttendanceRecord[]> {
    await new Promise((r) => setTimeout(r, 100));
    if (employeeId) {
      return this.attendance.filter((a) => a.employeeId === employeeId);
    }
    return [...this.attendance];
  }

  async clockIn(employeeId: string): Promise<AttendanceRecord> {
    await new Promise((r) => setTimeout(r, 150));
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0];

    const existing = this.attendance.find((a) => a.employeeId === employeeId && a.date === today);
    if (existing) {
      existing.clockInTime = nowTime;
      existing.status = "PRESENT";
      return { ...existing };
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId,
      date: today,
      clockInTime: nowTime,
      clockOutTime: null,
      breakDurationMinutes: 0,
      totalWorkHours: 0,
      status: "PRESENT",
      location: "Dayflow Main HQ",
    };
    this.attendance.unshift(newRecord);
    return { ...newRecord };
  }

  async clockOut(employeeId: string): Promise<AttendanceRecord> {
    await new Promise((r) => setTimeout(r, 150));
    const today = new Date().toISOString().split("T")[0];
    const nowTime = new Date().toTimeString().split(" ")[0];

    const existing = this.attendance.find((a) => a.employeeId === employeeId && a.date === today);
    if (!existing || !existing.clockInTime) {
      throw new Error("No active clock-in shift found for today");
    }

    existing.clockOutTime = nowTime;
    const [inH, inM] = existing.clockInTime.split(":").map(Number);
    const [outH, outM] = nowTime.split(":").map(Number);
    const diffHours = Math.max(0.1, (outH * 60 + outM - (inH * 60 + inM)) / 60);
    existing.totalWorkHours = parseFloat(diffHours.toFixed(2));

    return { ...existing };
  }

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    await new Promise((r) => setTimeout(r, 120));
    return [...this.leaves];
  }

  async applyLeave(
    request: Omit<LeaveRequest, "id" | "status" | "appliedDate">
  ): Promise<LeaveRequest> {
    await new Promise((r) => setTimeout(r, 180));
    const newLeave: LeaveRequest = {
      ...request,
      id: `leave-${Date.now()}`,
      status: "PENDING",
      appliedDate: new Date().toISOString().split("T")[0],
    };
    this.leaves.unshift(newLeave);

    // Deduct leave balance if applied
    const emp = this.employees.find((e) => e.id === request.employeeId);
    if (emp) {
      const typeKey = request.leaveType.toLowerCase() as keyof Employee["leaveBalances"];
      if (emp.leaveBalances[typeKey] !== undefined) {
        emp.leaveBalances[typeKey] = Math.max(0, emp.leaveBalances[typeKey] - request.totalDays);
      }
    }

    return { ...newLeave };
  }

  async reviewLeave(
    leaveId: string,
    status: "APPROVED" | "REJECTED",
    comments = ""
  ): Promise<LeaveRequest> {
    await new Promise((r) => setTimeout(r, 150));
    const idx = this.leaves.findIndex((l) => l.id === leaveId);
    if (idx === -1) throw new Error("Leave request not found");

    this.leaves[idx].status = status;
    this.leaves[idx].reviewerComments = comments;
    this.leaves[idx].reviewedDate = new Date().toISOString().split("T")[0];

    return { ...this.leaves[idx] };
  }

  async getNotifications(userId: string): Promise<NotificationItem[]> {
    return this.notifications.filter((n) => n.userId === userId || n.userId === "all");
  }

  async markNotificationRead(id: string): Promise<void> {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.isRead = true;
  }
}

export const dayflowApi = new DayflowMockBackendEngine();

// ============================================================
// REGION 07 — STATE MANAGEMENT (GLOBAL ZUSTAND STORE PATTERN)
// ============================================================

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
  rejectModalTarget: ApprovalItem | null;
  searchQuery: string;
  toasts: ToastMessage[];
}

export type HRMSAction =
  | { type: "SET_ROLE"; payload: UserRole }
  | { type: "SET_USER"; payload: string }
  | { type: "SET_TAB"; payload: NavigationTab }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR"; payload: boolean }
  | { type: "SELECT_EMPLOYEE"; payload: Employee | null }
  | { type: "OPEN_APPLY_LEAVE_MODAL"; payload: boolean }
  | { type: "OPEN_ADD_EMPLOYEE_MODAL"; payload: boolean }
  | { type: "OPEN_PROFILE_DRAWER"; payload: boolean }
  | { type: "SET_REJECT_TARGET"; payload: ApprovalItem | null }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "ADD_TOAST"; payload: Omit<ToastMessage, "id"> }
  | { type: "REMOVE_TOAST"; payload: string };

const initialHRMSState: HRMSState = {
  currentRole: "EMPLOYEE",
  currentUserId: "emp-001",
  activeTab: "dashboard",
  isSidebarOpen: false,
  selectedEmployee: null,
  isApplyLeaveModalOpen: false,
  isAddEmployeeModalOpen: false,
  isProfileDrawerOpen: false,
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
        // If switched to employee, bind to Evelyn; if HR, Marcus; if Admin, Evelyn as Admin
        currentUserId: action.payload === "HR" ? "emp-002" : "emp-001",
      };
    case "SET_USER":
      return { ...state, currentUserId: action.payload };
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
    case "SET_REJECT_TARGET":
      return { ...state, rejectModalTarget: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, { ...action.payload, id: `toast-${Date.now()}` }],
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

  // Auto dismiss toasts after 4 seconds
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

// ============================================================
// REGION 08 — PAGE COMPOSITIONS
// ============================================================

// 8.1 AUTHENTICATION PAGE
export const AuthPageView: React.FC<{ onAuthenticate: (role: UserRole) => void }> = ({
  onAuthenticate,
}) => {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("evelyn.vance@dayflow.io");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("EMPLOYEE");
  const [employeeIdInput, setEmployeeIdInput] = useState("DF-1001");
  const [fullName, setFullName] = useState("Evelyn Vance");
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Please fill in both email and password.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onAuthenticate(selectedRole);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] text-white shadow-xl shadow-purple-500/20 mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Dayflow</h1>
        <p className="text-sm text-slate-400 mt-1">Every workday, perfectly aligned.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => {
                setAuthMode("signin");
                setErrorMsg("");
              }}
              className={cn(
                "w-1/2 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer",
                authMode === "signin"
                  ? "border-[#7C3AED] text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode("signup");
                setErrorMsg("");
              }}
              className={cn(
                "w-1/2 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer",
                authMode === "signup"
                  ? "border-[#7C3AED] text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              Sign Up
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {authMode === "signup" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeIdInput}
                    onChange={(e) => setEmployeeIdInput(e.target.value)}
                    placeholder="e.g. DF-1006"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corporate Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@dayflow.io"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-3.5 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Role Persona (Interactive Demo)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["EMPLOYEE", "HR", "ADMIN"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={cn(
                      "py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                      selectedRole === r
                        ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-sm"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-[#7C3AED] focus:ring-[#7C3AED]"
                />
                <span>Remember this device</span>
              </label>
              <a href="#forgot" className="text-[#A78BFA] hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-2 font-bold bg-[#7C3AED] hover:bg-[#6D28D9]"
            >
              {authMode === "signin" ? `Sign In as ${selectedRole}` : `Create ${selectedRole} Account`}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Protected by enterprise-grade 256-bit encryption & role policies.
          </div>
        </div>
      </div>
    </div>
  );
};

// 8.2 DASHBOARD COMPOSITION (Role-Aware)
export const DashboardView: React.FC = () => {
  const { state, dispatch } = useHRMS();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empList, attList, leaveList] = await Promise.all([
        dayflowApi.getEmployees(),
        dayflowApi.getAttendanceRecords(),
        dayflowApi.getLeaveRequests(),
      ]);
      setEmployees(empList);
      setAttendance(attList);
      setLeaves(leaveList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === state.currentUserId) || employees[0];
  }, [employees, state.currentUserId]);

  const todayRecord = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return (
      attendance.find((a) => a.employeeId === currentEmployee?.id && a.date === today) || null
    );
  }, [attendance, currentEmployee?.id]);

  const handleClockIn = async () => {
    if (!currentEmployee) return;
    setIsPunching(true);
    try {
      await dayflowApi.clockIn(currentEmployee.id);
      dispatch({
        type: "ADD_TOAST",
        payload: {
          type: "success",
          title: "Clocked In",
          message: `Shift recorded at ${new Date().toLocaleTimeString()}`,
        },
      });
      await loadData();
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Action Failed", message: err.message },
      });
    } finally {
      setIsPunching(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentEmployee) return;
    setIsPunching(true);
    try {
      await dayflowApi.clockOut(currentEmployee.id);
      dispatch({
        type: "ADD_TOAST",
        payload: {
          type: "info",
          title: "Clocked Out",
          message: `Shift completed at ${new Date().toLocaleTimeString()}`,
        },
      });
      await loadData();
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Action Failed", message: err.message },
      });
    } finally {
      setIsPunching(false);
    }
  };

  if (isLoading || !currentEmployee) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-[#7C3AED] animate-spin" />
      </div>
    );
  }

  const isHRorAdmin = state.currentRole === "HR" || state.currentRole === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <Avatar
            name={`${currentEmployee.firstName} ${currentEmployee.lastName}`}
            src={currentEmployee.avatarUrl}
            size="xl"
            status="online"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Good morning, {currentEmployee.firstName}! 👋
              </h1>
              <Badge variant="brand" size="sm">
                {state.currentRole}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {currentEmployee.designation} • {currentEmployee.department} • {currentEmployee.employeeCode}
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
            My Attendance
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

      {/* Real-time Punch Clock Widget */}
      <PunchClockWidget
        currentRecord={todayRecord}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        isLoading={isPunching}
      />

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isHRorAdmin ? (
          <>
            <DashboardMetricCard
              title="Total Headcount"
              value={employees.length}
              subtext="Active full-time staff"
              icon={<Users className="w-5 h-5 text-purple-600" />}
              trend={{ value: "+8% MoM", positive: true }}
            />
            <DashboardMetricCard
              title="Present Today"
              value={attendance.filter((a) => a.date === "2026-08-22" && a.status === "PRESENT").length || 4}
              subtext="On-duty at office / remote"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              colorClass="bg-emerald-100 text-emerald-600"
            />
            <DashboardMetricCard
              title="Pending Approvals"
              value={leaves.filter((l) => l.status === "PENDING").length}
              subtext="Requires HR review"
              icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
              colorClass="bg-amber-100 text-amber-600"
            />
            <DashboardMetricCard
              title="Monthly Payroll"
              value="$32,500"
              subtext="Disbursed for August 2026"
              icon={<DollarSign className="w-5 h-5 text-cyan-600" />}
              colorClass="bg-cyan-100 text-cyan-600"
            />
          </>
        ) : (
          <>
            <DashboardMetricCard
              title="Shift Hours (Week)"
              value="38.5 hrs"
              subtext="Target: 40.0 hrs"
              icon={<Clock4 className="w-5 h-5 text-purple-600" />}
            />
            <DashboardMetricCard
              title="Paid Leaves Left"
              value={`${currentEmployee.leaveBalances.paid} Days`}
              subtext="Expires Dec 31, 2026"
              icon={<CalendarDays className="w-5 h-5 text-emerald-600" />}
              colorClass="bg-emerald-100 text-emerald-600"
            />
            <DashboardMetricCard
              title="Sick Leaves"
              value={`${currentEmployee.leaveBalances.sick} Days`}
              subtext="Medical allowance available"
              icon={<Coffee className="w-5 h-5 text-amber-600" />}
              colorClass="bg-amber-100 text-amber-600"
            />
            <DashboardMetricCard
              title="Current Gross Pay"
              value={`$${(
                currentEmployee.salary.basic +
                currentEmployee.salary.hra +
                currentEmployee.salary.specialAllowance
              ).toLocaleString()}`}
              subtext="Monthly compensation"
              icon={<DollarSign className="w-5 h-5 text-cyan-600" />}
              colorClass="bg-cyan-100 text-cyan-600"
            />
          </>
        )}
      </div>

      {/* Two Column Layout: Quick Access / Leave Balances & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Leave Balances Module */}
          <LeaveBalanceCard
            balances={currentEmployee.leaveBalances}
            onApplyClick={() => dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: true })}
          />

          {/* Recent Attendance Audit Snapshot */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Attendance Logs</h3>
                <p className="text-xs text-slate-500">Your latest recorded shifts</p>
              </div>
              <button
                onClick={() => dispatch({ type: "SET_TAB", payload: "attendance" })}
                className="text-xs font-semibold text-[#7C3AED] hover:underline"
              >
                View Full Timesheet →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Clock In</th>
                    <th className="pb-2.5">Clock Out</th>
                    <th className="pb-2.5">Work Hours</th>
                    <th className="pb-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendance
                    .filter((a) => a.employeeId === currentEmployee.id)
                    .slice(0, 4)
                    .map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 font-medium text-slate-900">{rec.date}</td>
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

        {/* Right Rail: Pending Approvals / Company Announcements */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#7C3AED]" />
              Recent Announcements
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <p className="font-bold text-purple-900">Upcoming Holiday: Labor Day</p>
                <p className="text-purple-700 mt-0.5">Office will be closed on Monday, Sept 7.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800">Q3 All-Hands Meeting</p>
                <p className="text-slate-600 mt-0.5">Thursday at 3:00 PM PST in Main Auditorium.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800">Health Insurance Renewal</p>
                <p className="text-slate-600 mt-0.5">Submit benefit updates by end of month.</p>
              </div>
            </div>
          </Card>

          {isHRorAdmin && (
            <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#A78BFA]" />
                HR Quick Actions
              </h3>
              <p className="text-xs text-slate-300 mb-4">
                You have {leaves.filter((l) => l.status === "PENDING").length} pending requests
                awaiting management review.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => dispatch({ type: "SET_TAB", payload: "approvals" })}
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9]"
              >
                Open Approval Center →
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// 8.3 EMPLOYEE DIRECTORY COMPOSITION
export const EmployeeDirectoryView: React.FC = () => {
  const { dispatch, state } = useHRMS();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dayflowApi.getEmployees().then((data) => {
      setEmployees(data);
      setIsLoading(false);
    });
  }, []);

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
      {/* Directory Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover colleagues, view role responsibilities, and manage employee records.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-white shadow-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                viewMode === "grid" ? "bg-[#7C3AED] text-white" : "text-slate-600 hover:text-slate-900"
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                viewMode === "table" ? "bg-[#7C3AED] text-white" : "text-slate-600 hover:text-slate-900"
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

      {/* Filter Bar */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, employee code, role, or email..."
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: "SET_SEARCH_QUERY", payload: e.target.value })}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap cursor-pointer",
                    selectedDept === dept
                      ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {dept}
                </button>
              ))}
            </div>

            <Select
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

      {/* Employees Render */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-[#7C3AED] animate-spin" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching employees found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or department filters to find staff members.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onViewProfile={(e) => dispatch({ type: "SELECT_EMPLOYEE", payload: e })}
              onEdit={(e) => dispatch({ type: "SELECT_EMPLOYEE", payload: e })}
              canEdit={isHRorAdmin}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Designation</th>
                  <th className="px-5 py-3">Work Location</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatarUrl} size="md" />
                      <div>
                        <p className="font-bold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{emp.employeeCode}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{emp.department}</td>
                    <td className="px-5 py-3.5 text-slate-600">{emp.designation}</td>
                    <td className="px-5 py-3.5 text-slate-600">{emp.workLocation}</td>
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
                    <td className="px-5 py-3.5 text-right">
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

// 8.4 ATTENDANCE & TIMESHEET COMPOSITION
export const AttendanceView: React.FC = () => {
  const { state, dispatch } = useHRMS();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("August 2026");
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
    const today = new Date().toISOString().split("T")[0];
    return attendance.find((a) => a.employeeId === state.currentUserId && a.date === today) || null;
  }, [attendance, state.currentUserId]);

  const handleClockIn = async () => {
    setIsPunching(true);
    try {
      await dayflowApi.clockIn(state.currentUserId);
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "success", title: "Clocked In", message: "Your shift has commenced." },
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
      await dayflowApi.clockOut(state.currentUserId);
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "info", title: "Clocked Out", message: "Shift ended successfully." },
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Attendance & Timesheets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time biometric punch tracking, timesheet records, and work hour auditing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#7C3AED] mr-2" />
            <span>{selectedMonth}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() =>
              dispatch({
                type: "ADD_TOAST",
                payload: {
                  type: "info",
                  title: "Export Initiated",
                  message: "Downloading timesheet CSV...",
                },
              })
            }
          >
            Export Logs
          </Button>
        </div>
      </div>

      {/* Interactive Punch Widget */}
      <PunchClockWidget
        currentRecord={todayRecord}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        isLoading={isPunching}
      />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Present Days</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">18</h3>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">94.7% On-time rate</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Half Days</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">1</h3>
          <p className="text-[10px] text-amber-600 font-medium mt-0.5">Approved partial shifts</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Hours</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">142.5</h3>
          <p className="text-[10px] text-purple-600 font-medium mt-0.5">Avg: 7.9 hrs/day</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-cyan-500">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Overtime</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">4.2</h3>
          <p className="text-[10px] text-cyan-600 font-medium mt-0.5">Eligible for bonus credit</p>
        </Card>
      </div>

      {/* Timesheet Audit Records Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Monthly Timesheet Breakdown</h3>
            <p className="text-xs text-slate-500">Detailed punch in/out timestamps and break deductions</p>
          </div>
          <Badge variant="brand" size="sm">
            {attendance.length} Total Logs
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-[#7C3AED] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Shift Window</th>
                  <th className="px-4 py-3">Clock In</th>
                  <th className="px-4 py-3">Clock Out</th>
                  <th className="px-4 py-3">Break Time</th>
                  <th className="px-4 py-3">Total Worked</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks / Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendance.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{row.date}</td>
                    <td className="px-4 py-3 text-slate-500">09:00 - 18:00</td>
                    <td className="px-4 py-3 font-mono font-medium text-emerald-700">
                      {row.clockInTime || "--:--:--"}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-700">
                      {row.clockOutTime || (row.clockInTime ? "Active Now" : "--:--:--")}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.breakDurationMinutes} mins</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{row.totalWorkHours} hrs</td>
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
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {row.remarks || row.location || "Standard Check-in"}
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

// 8.5 LEAVE & TIME-OFF MANAGEMENT COMPOSITION
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
  }, [loadLeaves]);

  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.id === state.currentUserId) || employees[0];
  }, [employees, state.currentUserId]);

  // Generate interactive 31-day calendar view for August 2026
  const calendarDays = useMemo(() => {
    const days = [];
    for (let day = 1; day <= 31; day++) {
      const dayStr = `2026-08-${day.toString().padStart(2, "0")}`;
      const dayOfWeek = (day + 5) % 7; // Aug 1, 2026 is Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const matchingLeave = leaves.find((l) => {
        return l.status === "APPROVED" && dayStr >= l.startDate && dayStr <= l.endDate;
      });

      days.push({
        day,
        dateStr: dayStr,
        isWeekend,
        leave: matchingLeave,
      });
    }
    return days;
  }, [leaves]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Leave & Time-Off Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit time-off requests, check leave balances, and review team holiday schedules.
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

      {/* Balance Summary Cards */}
      {currentEmployee && (
        <LeaveBalanceCard
          balances={currentEmployee.leaveBalances}
          onApplyClick={() => dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: true })}
        />
      )}

      {/* Interactive Monthly Calendar Grid */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">August 2026 Team Schedule</h3>
            <p className="text-xs text-slate-500">Color-coded leave and holiday tracker</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" /> Paid Leave
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Sick Leave
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Public Holiday
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-1 font-bold text-slate-400 uppercase text-[11px]">
              {day}
            </div>
          ))}

          {calendarDays.map((item) => (
            <div
              key={item.day}
              className={cn(
                "p-2.5 rounded-xl border min-h-[70px] flex flex-col justify-between text-left transition-all",
                item.isWeekend
                  ? "bg-slate-50 border-slate-200/60 text-slate-400"
                  : "bg-white border-slate-200 hover:border-[#7C3AED]",
                item.leave && "ring-2 ring-purple-400 bg-purple-50/40"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("font-bold text-xs", item.isWeekend ? "text-slate-400" : "text-slate-900")}>
                  {item.day}
                </span>
                {item.day === 22 && (
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] ring-2 ring-purple-200" title="Today" />
                )}
              </div>

              {item.leave && (
                <div className="mt-1">
                  <span className="block text-[10px] font-bold text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded truncate">
                    {item.leave.employeeName.split(" ")[0]} ({item.leave.leaveType})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Leave Request History Table */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Leave Request History</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-[#7C3AED] animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Date Range</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Applied Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reviewer Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {leaves.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{req.leaveType} LEAVE</td>
                    <td className="px-4 py-3 font-medium">
                      {req.startDate} to {req.endDate}
                    </td>
                    <td className="px-4 py-3">{req.totalDays} Days</td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-600">{req.reason}</td>
                    <td className="px-4 py-3 text-slate-400">{req.appliedDate}</td>
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
                    <td className="px-4 py-3 text-slate-500 italic">
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

// 8.6 APPROVAL CENTER (HR & Admin Operations)
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
      await dayflowApi.reviewLeave(id, "APPROVED", "Approved by HR Administrator.");
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "success", title: "Request Approved", message: "Leave has been granted." },
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            HR & Admin Approval Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review time-off requests, attendance correction disputes, and verify workforce operations.
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                activeFilter === filter
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {filter === "PENDING" && `Pending (${approvalItems.filter((i) => i.status === "PENDING").length})`}
              {filter === "APPROVED" && "Approved"}
              {filter === "REJECTED" && "Rejected"}
            </button>
          ))}
        </div>
      </div>

      {/* Approval Rows */}
      {filteredItems.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">All caught up!</h3>
          <p className="text-xs text-slate-500 mt-1">
            No {activeFilter.toLowerCase()} approval requests in the queue.
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

// 8.7 PAYROLL & SALARY BREAKDOWN VIEW
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

  const isHRorAdmin = state.currentRole === "HR" || state.currentRole === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payroll & Salary Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isHRorAdmin
              ? "Manage organizational salary structures and monthly disbursement schedules."
              : "Review monthly payslips, statutory deductions, and tax withholdings."}
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

      {/* Salary Card Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">August 2026 Payslip</h2>
              <p className="text-xs text-slate-500 font-mono">Statement ID: PS-202608-01</p>
            </div>
            <Badge variant="success" size="md" dot>
              Disbursed on Aug 20, 2026
            </Badge>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 text-emerald-700">
                Earnings (+)
              </h4>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-semibold text-slate-900">${basic.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">House Rent Allowance (HRA)</span>
                <span className="font-semibold text-slate-900">${hra.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">Special Allowance</span>
                <span className="font-semibold text-slate-900">
                  ${specialAllowance.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-100 font-bold text-slate-900">
                <span>Gross Earnings</span>
                <span className="text-emerald-700">${gross.toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 text-rose-700">
                Deductions (-)
              </h4>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">Provident Fund (PF)</span>
                <span className="font-semibold text-slate-900">
                  ${providentFund.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-600">Income Tax (TDS)</span>
                <span className="font-semibold text-slate-900">
                  ${taxDeduction.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-100 font-bold text-slate-900">
                <span>Total Deductions</span>
                <span className="text-rose-700">${deductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Take-Home Highlight */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-900">Net Take-Home Pay</p>
              <p className="text-[11px] text-purple-700">Directly deposited to Bank on file</p>
            </div>
            <h3 className="text-2xl font-black text-[#7C3AED]">
              ${netTakeHome.toLocaleString()} {currency}
            </h3>
          </div>
        </Card>

        {/* Bank & Tax Meta */}
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Disbursement Details</h3>
          <div className="space-y-2.5 text-xs text-slate-600">
            <div>
              <p className="text-slate-400 text-[11px]">Beneficiary Name</p>
              <p className="font-bold text-slate-800">
                {currentEmployee.firstName} {currentEmployee.lastName}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Bank Name</p>
              <p className="font-bold text-slate-800">Silicon Valley Tech Bank, N.A.</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Account Number (Masked)</p>
              <p className="font-mono text-slate-800">•••• •••• •••• 8842</p>
            </div>
            <div>
              <p className="text-slate-400 text-[11px]">Tax Identification Number</p>
              <p className="font-mono text-slate-800">TAX-US-991204</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

// 8.8 EMPLOYEE PROFILE DETAIL DRAWER / MODAL
export const EmployeeProfileDrawer: React.FC = () => {
  const { state, dispatch } = useHRMS();
  const emp = state.selectedEmployee;
  const [activeProfileTab, setActiveProfileTab] = useState<"personal" | "job" | "salary" | "docs">(
    "personal"
  );
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
        payload: { type: "success", title: "Profile Updated", message: "Contact details saved." },
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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => dispatch({ type: "OPEN_PROFILE_DRAWER", payload: false })}
      />
      <div className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatarUrl} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">
                  {emp.firstName} {emp.lastName}
                </h2>
                <Badge variant="brand" size="sm">
                  {emp.role}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">{emp.designation}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{emp.employeeCode}</p>
            </div>
          </div>
          <button
            onClick={() => dispatch({ type: "OPEN_PROFILE_DRAWER", payload: false })}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-white">
          {(["personal", "job", "salary", "docs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveProfileTab(tab)}
              className={cn(
                "py-3 px-3 text-xs font-bold border-b-2 capitalize transition-colors cursor-pointer",
                activeProfileTab === tab
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab === "docs" ? "Documents" : tab}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {activeProfileTab === "personal" && (
            <div className="space-y-4">
              <Input
                label="Primary Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Residential Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Input label="Email Address" value={emp.email} disabled helperText="Managed by corporate IT" />
            </div>
          )}

          {activeProfileTab === "job" && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400">Department:</span>
                <p className="font-bold text-slate-800">{emp.department}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400">Reporting Manager:</span>
                <p className="font-bold text-slate-800">{emp.managerName}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400">Joining Date:</span>
                <p className="font-bold text-slate-800">{emp.joiningDate}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400">Work Location:</span>
                <p className="font-bold text-slate-800">{emp.workLocation}</p>
              </div>
            </div>
          )}

          {activeProfileTab === "salary" && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
                <span className="text-slate-500">Basic Salary:</span>
                <span className="font-bold text-slate-900">${emp.salary.basic.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
                <span className="text-slate-500">House Rent Allowance:</span>
                <span className="font-bold text-slate-900">${emp.salary.hra.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
                <span className="text-slate-500">Special Allowances:</span>
                <span className="font-bold text-slate-900">
                  ${emp.salary.specialAllowance.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {activeProfileTab === "docs" && (
            <div className="space-y-3">
              {emp.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{doc.name}</p>
                      <p className="text-slate-400 text-[10px]">
                        {doc.size} • Uploaded {doc.uploadDate}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "OPEN_PROFILE_DRAWER", payload: false })}
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" isLoading={isSaving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// REGION 09 — ROUTING / MASTER VIEW ASSEMBLY
// ============================================================

export const HRMSApplication: React.FC = () => {
  const { state, dispatch } = useHRMS();
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  // Leave Form Local State
  const [leaveType, setLeaveType] = useState<LeaveType>("PAID");
  const [startDate, setStartDate] = useState("2026-08-25");
  const [endDate, setEndDate] = useState("2026-08-26");
  const [leaveReason, setLeaveReason] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Reject Modal Local State
  const [rejectReason, setRejectReason] = useState("");

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
      const curEmp = employees.find((e) => e.id === state.currentUserId) || employees[0];
      await dayflowApi.applyLeave({
        employeeId: curEmp.id,
        employeeName: `${curEmp.firstName} ${curEmp.lastName}`,
        employeeAvatar: curEmp.avatarUrl,
        employeeDepartment: curEmp.department,
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
          title: "Leave Applied",
          message: "Request submitted for HR approval.",
        },
      });
      dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: false });
      setLeaveReason("");
    } catch (err: any) {
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "error", title: "Submission Failed", message: err.message },
      });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!state.rejectModalTarget) return;
    try {
      await dayflowApi.reviewLeave(
        state.rejectModalTarget.referenceId,
        "REJECTED",
        rejectReason || "Request declined by HR Officer."
      );
      dispatch({
        type: "ADD_TOAST",
        payload: { type: "info", title: "Request Rejected", message: "Employee notified with remarks." },
      });
      dispatch({ type: "SET_REJECT_TARGET", payload: null });
      setRejectReason("");
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
        onAuthenticate={(role) => {
          dispatch({ type: "SET_ROLE", payload: role });
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; allowedRoles: UserRole[] }[] = [
    { id: "dashboard", label: "Dashboard", icon: <Layers className="w-4 h-4" />, allowedRoles: ["EMPLOYEE", "HR", "ADMIN"] },
    { id: "directory", label: "Employee Directory", icon: <Users className="w-4 h-4" />, allowedRoles: ["EMPLOYEE", "HR", "ADMIN"] },
    { id: "attendance", label: "Attendance & Logs", icon: <Clock className="w-4 h-4" />, allowedRoles: ["EMPLOYEE", "HR", "ADMIN"] },
    { id: "leaves", label: "Time-Off & Leaves", icon: <Calendar className="w-4 h-4" />, allowedRoles: ["EMPLOYEE", "HR", "ADMIN"] },
    { id: "approvals", label: "Approval Center", icon: <CheckSquare className="w-4 h-4" />, allowedRoles: ["HR", "ADMIN"] },
    { id: "payroll", label: "Payroll & Payslips", icon: <DollarSign className="w-4 h-4" />, allowedRoles: ["EMPLOYEE", "HR", "ADMIN"] },
  ];

  const visibleNav = navItems.filter((item) => item.allowedRoles.includes(state.currentRole));

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
      {/* Top Demo Bar for Interactive Persona Switching */}
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs border-b border-slate-800 z-30">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <span className="font-bold tracking-wide">DAYFLOW LIVE ENVIRONMENT</span>
        </div>

        <RoleSwitcherPill
          currentRole={state.currentRole}
          onRoleChange={(r) => dispatch({ type: "SET_ROLE", payload: r })}
        />
      </div>

      {/* Main Body Shell */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
            state.isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div>
            {/* Sidebar Brand */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center font-black shadow-md">
                  D
                </div>
                <span className="text-base font-black text-white tracking-tight">Dayflow HRMS</span>
              </div>
              <button
                onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="p-4 space-y-1.5">
              {visibleNav.map((item) => {
                const isActive = state.activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => dispatch({ type: "SET_TAB", payload: item.id })}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                      isActive
                        ? "bg-[#7C3AED] text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Footer Profile */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              <Avatar name="Evelyn Vance" size="sm" status="online" />
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate">Evelyn Vance</p>
                <p className="text-[10px] text-slate-400 truncate">{state.currentRole} Access</p>
              </div>
            </div>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Content Container */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Top Bar */}
          <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
                className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-slate-900 capitalize">
                {state.activeTab.replace("-", " ")}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  dispatch({
                    type: "ADD_TOAST",
                    payload: {
                      type: "info",
                      title: "Notifications",
                      message: "You have 3 unread team notices.",
                    },
                  })
                }
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 relative cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7C3AED]" />
              </button>

              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
                <span className="text-xs font-bold text-slate-700">Apex Global Corp</span>
              </div>
            </div>
          </header>

          {/* Render Active View */}
          <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto">
            {state.activeTab === "dashboard" && <DashboardView />}
            {state.activeTab === "directory" && <EmployeeDirectoryView />}
            {state.activeTab === "attendance" && <AttendanceView />}
            {state.activeTab === "leaves" && <LeaveManagementView />}
            {state.activeTab === "approvals" && <ApprovalCenterView />}
            {state.activeTab === "payroll" && <PayrollView />}
          </div>
        </main>
      </div>

      {/* Global Slide-In Profile Drawer */}
      <EmployeeProfileDrawer />

      {/* Apply Leave Modal */}
      <Modal
        isOpen={state.isApplyLeaveModalOpen}
        onClose={() => dispatch({ type: "OPEN_APPLY_LEAVE_MODAL", payload: false })}
        title="Apply for Time-Off / Leave"
        description="Submit your leave application for manager & HR approval."
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
              Submit Application
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleApplyLeaveSubmit}>
          <Select
            label="Leave Type"
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
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason / Remarks
            </label>
            <textarea
              required
              rows={3}
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Please provide details about your leave request..."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>
        </form>
      </Modal>

      {/* Reject with Reason Modal */}
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
          <p className="text-xs text-slate-600">
            You are rejecting request for <strong>{state.rejectModalTarget?.employeeName}</strong> (
            {state.rejectModalTarget?.title}).
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this request is declined..."
            className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
          />
        </div>
      </Modal>

      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {state.toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "p-4 rounded-xl shadow-lg border pointer-events-auto flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 bg-white",
              toast.type === "success" && "border-emerald-200 bg-emerald-50/80 text-emerald-950",
              toast.type === "error" && "border-rose-200 bg-rose-50/80 text-rose-950",
              toast.type === "info" && "border-purple-200 bg-purple-50/80 text-purple-950",
              toast.type === "warning" && "border-amber-200 bg-amber-50/80 text-amber-950"
            )}
          >
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {toast.type === "error" && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {toast.type === "info" && <Sparkles className="w-5 h-5 text-[#7C3AED] shrink-0" />}
            {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
            <div className="flex-1">
              <h5 className="text-xs font-bold">{toast.title}</h5>
              <p className="text-[11px] opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => dispatch({ type: "REMOVE_TOAST", payload: toast.id })}
              className="opacity-50 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// REGION 10 — ACCESSIBILITY & RESPONSIVE RULES
// ============================================================
/**
 * ACCESSIBILITY & RESPONSIVE ARCHITECTURE GUIDELINES:
 * 1. Semantic Tags: <main>, <aside>, <nav>, <header>, <table>, <button>.
 * 2. WCAG 2.1 AA Contrast: Minimum 4.5:1 on text and 3:1 on UI indicators.
 * 3. ARIA Roles: aria-modal="true", role="dialog", aria-expanded on accordions.
 * 4. Responsive Breakpoints:
 *    - Mobile (< 768px): Hamburger drawer, card-stacked tables, full-width modals.
 *    - Tablet (768px - 1024px): 2-column KPI grids, collapsible sidebar.
 *    - Desktop (> 1024px): 4-column KPI grids, persistent left rail, rich data tables.
 */

// ============================================================
// REGION 11 — TESTABLE PURE FUNCTIONS
// ============================================================

export function calculateWorkHours(
  clockIn: string | null,
  clockOut: string | null,
  breakMinutes = 0
): number {
  if (!clockIn || !clockOut) return 0;
  const [inH, inM] = clockIn.split(":").map(Number);
  const [outH, outM] = clockOut.split(":").map(Number);
  const totalMinutes = outH * 60 + outM - (inH * 60 + inM) - breakMinutes;
  return Math.max(0, parseFloat((totalMinutes / 60).toFixed(2)));
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function getLeaveDaysCount(startDate: string, endDate: string, isHalfDay = false): number {
  if (isHalfDay) return 0.5;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

export function filterEmployees(
  employees: Employee[],
  search: string,
  department = "ALL",
  status = "ALL"
): Employee[] {
  return employees.filter((emp) => {
    const q = search.toLowerCase();
    const matchQuery =
      !search ||
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q);

    const matchDept = department === "ALL" || emp.department === department;
    const matchStatus = status === "ALL" || emp.status === status;

    return matchQuery && matchDept && matchStatus;
  });
}

// ============================================================
// REGION 12 — DEVELOPMENT NOTES / HANDOFF
// ============================================================
/**
 * HANDOFF NOTES & PRODUCTION BACKEND INTEGRATION:
 * 
 * Verified Flows:
 * 1. Authentication: Sign In/Up, password toggle, role redirection.
 * 2. Live Shift Punch: Real-time clock in/out with elapsed timer and timesheet logging.
 * 3. Employee Directory: Search, multi-criteria filtering, table/grid views, profile drawer.
 * 4. Leave Management: Leave balance cards, calendar grid mapping, modal application.
 * 5. Approval Workflows: Pending queue, quick approve, reject with comment prompt.
 * 6. Payroll: Read-only payslip calculation with tax/PF deductions.
 * 
 * Production API Endpoints to bind:
 * - GET  /api/v1/employees              ──► dayflowApi.getEmployees()
 * - POST /api/v1/attendance/punch-in   ──► dayflowApi.clockIn()
 * - POST /api/v1/attendance/punch-out  ──► dayflowApi.clockOut()
 * - POST /api/v1/leaves/apply          ──► dayflowApi.applyLeave()
 * - PUT  /api/v1/approvals/:id         ──► dayflowApi.reviewLeave()
 */

export default function App() {
  return (
    <HRMSProvider>
      <HRMSApplication />
    </HRMSProvider>
  );
}
