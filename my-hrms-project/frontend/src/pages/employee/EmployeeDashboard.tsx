import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  DollarSign,
  Coffee,
  CalendarDays,
  Plus,
  RefreshCw,
  Bell,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import {
  AttendanceRecord,
  TimeOffAllocation,
  TimeOffRequest,
} from "../../types/hrms";
import {
  Button,
  Card,
  Badge,
  Avatar,
  cn,
} from "../../components/ui/Primitives";
import { PunchClockWidget } from "../../components/shared/PunchClockWidget";

interface EmployeeDashboardProps {
  onNavigate: (tabId: string) => void;
  onOpenApplyLeave: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  onNavigate,
  onOpenApplyLeave,
}) => {
  const { user, addToast } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attRes, allocRes, reqRes] = await Promise.allSettled([
        api.attendance.getRecords(),
        api.timeOff.getAllocations(),
        api.timeOff.getRequests(),
      ]);

      if (attRes.status === "fulfilled") {
        setAttendance(attRes.value.attendance || []);
      }
      if (allocRes.status === "fulfilled") {
        setAllocations(allocRes.value.allocations || []);
      }
      if (reqRes.status === "fulfilled") {
        setLeaveRequests(reqRes.value.time_off_requests || []);
      }
    } catch (err: any) {
      console.error("Employee dashboard load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayDateStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const todayRecord = useMemo(() => {
    return (
      attendance.find(
        (a) => a.employee_id === user?.id && a.date === todayDateStr
      ) || null
    );
  }, [attendance, user?.id, todayDateStr]);

  const handleClockIn = async () => {
    setIsPunching(true);
    try {
      await api.attendance.checkIn();
      addToast({
        type: "success",
        title: "Clocked In",
        message: "Your check-in has been logged successfully.",
      });
      await loadData();
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
      await loadData();
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

  const paidLeaveAlloc = allocations.find((a) =>
    a.time_off_types?.name?.toLowerCase().includes("paid")
  );
  const sickLeaveAlloc = allocations.find((a) =>
    a.time_off_types?.name?.toLowerCase().includes("sick")
  );

  const paidDaysRemaining = paidLeaveAlloc
    ? paidLeaveAlloc.total_days - paidLeaveAlloc.used_days
    : 24;
  const sickDaysRemaining = sickLeaveAlloc
    ? sickLeaveAlloc.total_days - sickLeaveAlloc.used_days
    : 7;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user?.full_name || "Employee"} size="xl" status="online" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Good day, {user?.full_name}! 👋
              </h1>
              <Badge variant="brand" size="sm">
                EMPLOYEE
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {user?.designation || "Staff Member"} • {user?.department || "General"} •{" "}
              <strong className="font-mono text-purple-700">{user?.login_id}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("employee-attendance")}
            leftIcon={<Calendar className="w-4 h-4" />}
          >
            My Attendance
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenApplyLeave}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Apply Leave
          </Button>
        </div>
      </div>

      {/* Real-time Punch Station Widget */}
      <PunchClockWidget
        currentRecord={todayRecord}
        onClockIn={handleClockIn}
        onClockOut={handleClockOut}
        isLoading={isPunching}
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Paid Leaves Left</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{paidDaysRemaining} Days</h3>
          <p className="text-[10px] text-purple-600 mt-0.5">Vacation & Personal</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Sick Leaves Left</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{sickDaysRemaining} Days</h3>
          <p className="text-[10px] text-amber-600 mt-0.5">Medical time-off</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">This Month Shifts</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{attendance.length}</h3>
          <p className="text-[10px] text-emerald-600 mt-0.5">Logged attendance days</p>
        </Card>
        <Card
          className="p-4 border-l-4 border-l-cyan-500 hoverEffect"
          onClick={() => onNavigate("employee-salary")}
        >
          <p className="text-[11px] font-bold text-slate-500 uppercase">My Compensation</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">Salary & PF</h3>
          <p className="text-[10px] text-cyan-600 mt-0.5 font-semibold">View Payslip →</p>
        </Card>
      </div>

      {/* Two Column Layout: Attendance & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Attendance Logs */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Attendance Logs</h3>
                <p className="text-xs text-slate-500">Your latest recorded shifts</p>
              </div>
              <button
                onClick={() => onNavigate("employee-attendance")}
                className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Full Timesheet <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {attendance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No attendance logs found for today yet. Use the Punch Clock above to check in.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Clock In</th>
                      <th className="px-3.5 py-2.5">Clock Out</th>
                      <th className="px-3.5 py-2.5">Work Hours</th>
                      <th className="px-3.5 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {attendance.slice(0, 5).map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/70">
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">{rec.date}</td>
                        <td className="px-3.5 py-2.5 font-mono text-emerald-700 font-medium">
                          {rec.check_in || "--:--:--"}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-700 font-medium">
                          {rec.check_out || (rec.check_in ? "In Progress" : "--:--:--")}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900">
                          {rec.work_hours !== undefined ? `${rec.work_hours} hrs` : "--"}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <Badge
                            variant={
                              rec.status === "present"
                                ? "success"
                                : rec.status === "half_day"
                                ? "warning"
                                : "danger"
                            }
                            size="sm"
                            dot
                          >
                            {rec.status?.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Recent Leave Requests */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Leave Applications</h3>
                <p className="text-xs text-slate-500">Track status of your submitted time-off requests</p>
              </div>
              <button
                onClick={() => onNavigate("employee-leaves")}
                className="text-xs font-bold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Leave Center <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {leaveRequests.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No leave requests filed yet. Click "Apply Leave" to submit a request.
              </div>
            ) : (
              <div className="space-y-2.5">
                {leaveRequests.slice(0, 3).map((l) => (
                  <div
                    key={l.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {l.time_off_types?.name || "Leave"}
                        </span>
                        <Badge
                          variant={
                            l.status === "approved"
                              ? "success"
                              : l.status === "pending"
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                          dot
                        >
                          {l.status?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        {l.start_date} → {l.end_date}
                      </p>
                    </div>
                    {l.reason && (
                      <span className="text-slate-400 italic max-w-xs truncate hidden sm:block">
                        "{l.reason}"
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Rail: Company Announcements */}
        <div className="space-y-6">
          <Card className="p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#7C3AED]" />
              Company Announcements
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <p className="font-bold text-purple-900">HR Timesheet Reminder</p>
                <p className="text-purple-700 mt-0.5">
                  Ensure daily clock-ins and clock-outs are recorded to maintain full payable days.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800">Direct Deposit Cycle</p>
                <p className="text-slate-600 mt-0.5">
                  Monthly payroll runs are finalized by the end of each month.
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-800">Support & Help Desk</p>
                <p className="text-slate-600 mt-0.5">
                  For attendance disputes or profile corrections, contact your HR Officer.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
