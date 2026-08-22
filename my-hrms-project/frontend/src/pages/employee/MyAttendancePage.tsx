import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  Calendar,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { AttendanceRecord } from "../../types/hrms";
import {
  Button,
  Card,
  Badge,
  Input,
  cn,
} from "../../components/ui/Primitives";
import { PunchClockWidget } from "../../components/shared/PunchClockWidget";

export const MyAttendancePage: React.FC = () => {
  const { user, addToast } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPunching, setIsPunching] = useState(false);

  // Date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadAttendance = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.attendance.getRecords({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setAttendance(res.attendance || []);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Load Failed",
        message: err.message || "Failed to load attendance logs.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, addToast]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

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
        message: "Your attendance check-in has been logged.",
      });
      await loadAttendance();
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
      await loadAttendance();
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

  const totalWorkedHours = useMemo(() => {
    return attendance.reduce((acc, r) => acc + (r.work_hours || 0), 0);
  }, [attendance]);

  const totalExtraHours = useMemo(() => {
    return attendance.reduce((acc, r) => acc + (r.extra_hours || 0), 0);
  }, [attendance]);

  const exportCSV = () => {
    const headers = ["Date", "Clock In", "Clock Out", "Work Hours", "Overtime", "Status"];
    const rows = attendance.map((r) => [
      r.date,
      r.check_in || "--:--",
      r.check_out || "Active",
      r.work_hours || 0,
      r.extra_hours || 0,
      r.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `my_attendance_${todayDateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Attendance & Timesheet
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log your daily shift punch in/out, verify accumulated work hours, and audit timesheet history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            leftIcon={<Download className="w-4 h-4 text-purple-600" />}
          >
            Export Timesheet CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={loadAttendance}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total Shifts</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{attendance.length}</h3>
          <p className="text-[10px] text-purple-600 mt-0.5">Recorded duty sessions</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Present Days</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {attendance.filter((a) => a.status === "present").length}
          </h3>
          <p className="text-[10px] text-emerald-600 mt-0.5">Full duty shifts</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-cyan-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total Hours</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {totalWorkedHours.toFixed(1)} hrs
          </h3>
          <p className="text-[10px] text-cyan-600 mt-0.5">Accumulated shift time</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Overtime Logged</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {totalExtraHours.toFixed(1)} hrs
          </h3>
          <p className="text-[10px] text-amber-600 mt-0.5">Extra hours over standard</p>
        </Card>
      </div>

      {/* Date Filter Bar */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-bold text-slate-700">Filter Period:</span>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              placeholder="From Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-xs text-slate-400">to</span>
            <Input
              type="date"
              placeholder="To Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Timesheet Logs Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#7C3AED]" />
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No attendance logs found</p>
            <p className="text-slate-400 mt-0.5">Use the Punch Clock above to start your shift.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Clock In</th>
                  <th className="px-5 py-3.5">Clock Out</th>
                  <th className="px-5 py-3.5">Work Hours</th>
                  <th className="px-5 py-3.5">Overtime</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-900">{rec.date}</td>
                    <td className="px-5 py-3 font-mono font-medium text-emerald-700">
                      {rec.check_in || "--:--:--"}
                    </td>
                    <td className="px-5 py-3 font-mono font-medium text-slate-700">
                      {rec.check_out || (rec.check_in ? "In Progress" : "--:--:--")}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      {rec.work_hours !== undefined ? `${rec.work_hours} hrs` : "--"}
                    </td>
                    <td className="px-5 py-3 text-slate-500 font-mono">
                      {rec.extra_hours ? `+${rec.extra_hours} hrs` : "0.00"}
                    </td>
                    <td className="px-5 py-3">
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
    </div>
  );
};
