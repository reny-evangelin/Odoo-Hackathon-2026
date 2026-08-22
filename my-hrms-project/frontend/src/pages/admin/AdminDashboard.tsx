import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserPlus,
  Calendar,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Building,
  RefreshCw,
  Check,
  X,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import {
  EmployeeRecord,
  AttendanceRecord,
  TimeOffRequest,
} from "../../types/hrms";
import { Button, Card, Badge, Avatar, cn } from "../../components/ui/Primitives";
import { PunchClockWidget } from "../../components/shared/PunchClockWidget";

interface AdminDashboardProps {
  onNavigate: (tabId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, addToast } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [empRes, attRes, leaveRes] = await Promise.allSettled([
        api.employees.list(),
        api.attendance.getRecords(),
        api.timeOff.getRequests(),
      ]);

      if (empRes.status === "fulfilled") {
        setEmployees(empRes.value.employees || []);
      }
      if (attRes.status === "fulfilled") {
        setAttendance(attRes.value.attendance || []);
      }
      if (leaveRes.status === "fulfilled") {
        setLeaveRequests(leaveRes.value.time_off_requests || []);
      }
    } catch (err: any) {
      console.error("Dashboard data load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Today's attendance record for current admin
  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const currentAdminAttendance = useMemo(() => {
    return (
      attendance.find(
        (a) => a.employee_id === user?.id && a.date === todayDateStr
      ) || null
    );
  }, [attendance, user?.id, todayDateStr]);

  // Compute live statistics
  const totalEmployeesCount = employees.length;
  const presentTodayCount = attendance.filter(
    (a) => a.date === todayDateStr && (a.status === "present" || a.status === "half_day")
  ).length;
  const pendingLeavesCount = leaveRequests.filter(
    (l) => l.status === "pending"
  ).length;
  const onLeaveTodayCount = leaveRequests.filter(
    (l) =>
      l.status === "approved" &&
      todayDateStr >= l.start_date &&
      todayDateStr <= l.end_date
  ).length;

  const handleClockIn = async () => {
    setIsPunching(true);
    try {
      await api.attendance.checkIn();
      addToast({
        type: "success",
        title: "Clocked In",
        message: "Your attendance check-in has been logged successfully.",
      });
      await loadDashboardData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Clock In Failed",
        message: err.message || "Failed to record check-in.",
      });
    } finally {
      setIsPunching(false);
    }
  };

  const handleClockOut = async () => {
    setIsPunching(true);
    try {
      const res = await api.attendance.checkOut();
      addToast({
        type: "info",
        title: "Clocked Out",
        message: `Shift recorded with ${res.work_hours} work hours.`,
      });
      await loadDashboardData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Clock Out Failed",
        message: err.message || "Failed to record check-out.",
      });
    } finally {
      setIsPunching(false);
    }
  };

  const handleQuickApprove = async (requestId: string) => {
    setActionProcessing(requestId);
    try {
      await api.timeOff.approveReject(requestId, "approved");
      addToast({
        type: "success",
        title: "Leave Approved",
        message: "The time-off request has been approved and balance updated.",
      });
      await loadDashboardData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Approval Failed",
        message: err.message || "Failed to approve request.",
      });
    } finally {
      setActionProcessing(null);
    }
  };

  const handleQuickReject = async (requestId: string) => {
    setActionProcessing(requestId);
    try {
      await api.timeOff.approveReject(requestId, "rejected");
      addToast({
        type: "info",
        title: "Leave Declined",
        message: "The time-off request has been rejected.",
      });
      await loadDashboardData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Action Failed",
        message: err.message || "Failed to reject request.",
      });
    } finally {
      setActionProcessing(null);
    }
  };

  const handleRunAbsentJob = async () => {
    try {
      const res = await api.attendance.markAbsentJob();
      addToast({
        type: "success",
        title: "Daily Attendance Audit Run",
        message: `${res.absent_count} absent records evaluated for today.`,
      });
      await loadDashboardData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Job Error",
        message: err.message || "Failed to execute absent marking job.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user?.full_name || "Admin"} size="xl" status="online" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Welcome back, {user?.full_name}! 👋
              </h1>
              <Badge variant="brand" size="sm">
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {user?.company_name || "Enterprise HRMS"} • Admin Station & Workforce Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Data
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate("admin-add-employee")}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Add Employee
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 hoverEffect" onClick={() => onNavigate("admin-employees")}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Employees
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {totalEmployeesCount}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-100 text-[#7C3AED]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Registered workforce</span>
            <span className="font-semibold text-purple-700 flex items-center gap-0.5">
              View All →
            </span>
          </div>
        </Card>

        <Card className="p-5 hoverEffect" onClick={() => onNavigate("admin-attendance")}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Present Today
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {presentTodayCount}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Checked in today</span>
            <span className="font-semibold text-emerald-700 flex items-center gap-0.5">
              Timesheets →
            </span>
          </div>
        </Card>

        <Card className="p-5 hoverEffect" onClick={() => onNavigate("admin-leaves")}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                On Leave Today
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {onLeaveTodayCount}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-cyan-100 text-cyan-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Approved out-of-office</span>
            <span className="font-semibold text-cyan-700">Calendar →</span>
          </div>
        </Card>

        <Card className="p-5 hoverEffect" onClick={() => onNavigate("admin-leaves")}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending Leaves
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                {pendingLeavesCount}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Needs review</span>
            <span className="font-semibold text-amber-700">Approve →</span>
          </div>
        </Card>
      </div>

      {/* Admin Personal Punch Clock */}
      <PunchClockWidget
        currentRecord={currentAdminAttendance}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        isLoading={isPunching}
      />

      {/* Two Column Layout: Recent Employees & Quick Actions / Pending Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Employees & Attendance Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Employees Table */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Employees</h3>
                <p className="text-xs text-slate-500">Latest active employees added to company</p>
              </div>
              <button
                onClick={() => onNavigate("admin-employees")}
                className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Directory <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {employees.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No employee records found. Use "Add Employee" to create the first profile.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Employee</th>
                      <th className="px-3.5 py-2.5">Login ID</th>
                      <th className="px-3.5 py-2.5">Role</th>
                      <th className="px-3.5 py-2.5">Department</th>
                      <th className="px-3.5 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {employees.slice(0, 5).map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3.5 py-3 flex items-center gap-2.5">
                          <Avatar name={emp.full_name} size="sm" />
                          <div>
                            <p className="font-bold text-slate-900">{emp.full_name}</p>
                            <p className="text-[10px] text-slate-400">{emp.email}</p>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 font-mono text-slate-600 font-semibold">
                          {emp.login_id}
                        </td>
                        <td className="px-3.5 py-3">
                          <Badge
                            variant={emp.role === "admin" ? "brand" : emp.role === "hr" ? "info" : "neutral"}
                            size="sm"
                          >
                            {emp.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-3.5 py-3 text-slate-600">
                          {emp.department || "General"}
                        </td>
                        <td className="px-3.5 py-3">
                          <Badge
                            variant={emp.status === "active" ? "success" : "danger"}
                            size="sm"
                            dot
                          >
                            {emp.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Pending Leave Requests Queue */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pending Leave Requests</h3>
                <p className="text-xs text-slate-500">Employee applications awaiting management authorization</p>
              </div>
              <button
                onClick={() => onNavigate("admin-leaves")}
                className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
              >
                All Requests ({pendingLeavesCount}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {leaveRequests.filter((l) => l.status === "pending").length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-700">All leave requests processed!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No pending items in queue.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaveRequests
                  .filter((l) => l.status === "pending")
                  .slice(0, 3)
                  .map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={req.employees?.full_name || "Employee"} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">
                              {req.employees?.full_name || req.employee_id}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {req.employees?.login_id}
                            </span>
                            <Badge variant="warning" size="sm">
                              {req.time_off_types?.name || "Leave"}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                            {req.start_date} → {req.end_date}
                          </p>
                          {req.reason && (
                            <p className="text-[11px] text-slate-500 italic mt-1 bg-white p-1.5 rounded border border-slate-100">
                              "{req.reason}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionProcessing === req.id}
                          onClick={() => handleQuickReject(req.id)}
                          className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs px-2.5"
                          leftIcon={<X className="w-3.5 h-3.5" />}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          isLoading={actionProcessing === req.id}
                          onClick={() => handleQuickApprove(req.id)}
                          className="text-xs px-2.5"
                          leftIcon={<Check className="w-3.5 h-3.5" />}
                        >
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Rail: Quick Actions & System Operations */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-400" />
              Administrative Operations
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Rapid access to standard enterprise workflows
            </p>

            <div className="space-y-2.5">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate("admin-add-employee")}
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] justify-start text-xs font-semibold"
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Add New Employee Account
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("admin-payroll")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 justify-start text-xs font-semibold"
                leftIcon={<DollarSign className="w-4 h-4 text-emerald-400" />}
              >
                Process Monthly Payroll
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate("admin-company")}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 justify-start text-xs font-semibold"
                leftIcon={<Building className="w-4 h-4 text-cyan-400" />}
              >
                Company Branding & Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunAbsentJob}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 justify-start text-xs font-semibold"
                leftIcon={<Clock className="w-4 h-4 text-amber-400" />}
              >
                Run Today's Absent Audit Job
              </Button>
            </div>
          </Card>

          {/* System Environment Summary */}
          <Card className="p-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              System Environment
            </h3>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Tenant Company:</span>
              <span className="font-bold text-slate-800">{user?.company_name || "Enterprise"}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Database Engine:</span>
              <span className="font-semibold text-emerald-600">Supabase Cloud Connected</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">FastAPI API Status:</span>
              <span className="font-semibold text-emerald-600">Online (:5000)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Security:</span>
              <span className="font-semibold text-purple-700">Bearer JWT Auth</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
