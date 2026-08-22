import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  Calendar,
  Search,
  Download,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { AttendanceRecord, EmployeeRecord } from "../../types/hrms";
import {
  Button,
  Card,
  Badge,
  Avatar,
  Input,
  Select,
  cn,
} from "../../components/ui/Primitives";

export const AttendanceAdminPage: React.FC = () => {
  const { addToast } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJobRunning, setIsJobRunning] = useState(false);

  // Filters
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        api.attendance.getRecords({
          employee_id: selectedEmployeeId !== "ALL" ? selectedEmployeeId : undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        }),
        api.employees.list(),
      ]);
      setAttendance(attRes.attendance || []);
      setEmployees(empRes.employees || []);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Load Failed",
        message: err.message || "Failed to load attendance logs.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedEmployeeId, startDate, endDate, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunAbsentJob = async () => {
    setIsJobRunning(true);
    try {
      const res = await api.attendance.markAbsentJob();
      addToast({
        type: "success",
        title: "Absent Audit Job Complete",
        message: `Evaluated ${res.absent_count} absent records for active staff.`,
      });
      await loadData();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Job Execution Failed",
        message: err.message || "Failed to mark absent records.",
      });
    } finally {
      setIsJobRunning(false);
    }
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter((rec) => {
      const empName = rec.employees?.full_name?.toLowerCase() || "";
      const loginId = rec.employees?.login_id?.toLowerCase() || "";
      const q = searchQuery.toLowerCase();

      const matchSearch = !searchQuery || empName.includes(q) || loginId.includes(q);
      const matchStatus = statusFilter === "ALL" || rec.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [attendance, searchQuery, statusFilter]);

  const exportCSV = () => {
    const headers = ["Record ID", "Employee Name", "Login ID", "Date", "Check In", "Check Out", "Work Hours", "Extra Hours", "Status"];
    const rows = filteredAttendance.map((r) => [
      r.id,
      `"${r.employees?.full_name || r.employee_id}"`,
      r.employees?.login_id || "--",
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
    link.download = `attendance_logs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    addToast({
      type: "success",
      title: "Export Generated",
      message: "Attendance CSV log downloaded to your system.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Workforce Attendance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time check-in logs, biometric timesheet reconciliation, and absence auditing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunAbsentJob}
            isLoading={isJobRunning}
            leftIcon={<Clock className="w-4 h-4 text-amber-500" />}
          >
            Run Absent Audit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            leftIcon={<Download className="w-4 h-4 text-purple-600" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={loadData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-purple-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Total Shift Logs</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{attendance.length}</h3>
          <p className="text-[10px] text-purple-600 mt-0.5">Audited records</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Present Shifts</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {attendance.filter((a) => a.status === "present").length}
          </h3>
          <p className="text-[10px] text-emerald-600 mt-0.5">Full duty shifts</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-amber-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Half Days</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {attendance.filter((a) => a.status === "half_day").length}
          </h3>
          <p className="text-[10px] text-amber-600 mt-0.5">Partial hours</p>
        </Card>
        <Card className="p-4 border-l-4 border-l-rose-500">
          <p className="text-[11px] font-bold text-slate-500 uppercase">Marked Absent</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">
            {attendance.filter((a) => a.status === "absent").length}
          </h3>
          <p className="text-[10px] text-rose-600 mt-0.5">Unrecorded days</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <Input
              placeholder="Search by employee name or login ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <Select
            label=""
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            options={[
              { label: "All Employees", value: "ALL" },
              ...employees.map((emp) => ({
                label: `${emp.full_name} (${emp.login_id})`,
                value: emp.id,
              })),
            ]}
          />

          <Input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Card>

      {/* Attendance Records Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#7C3AED]" />
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No attendance records found</p>
            <p className="text-slate-400 mt-0.5">Try resetting your date filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Clock In</th>
                  <th className="px-5 py-3.5">Clock Out</th>
                  <th className="px-5 py-3.5">Work Hours</th>
                  <th className="px-5 py-3.5">Extra Hours</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 flex items-center gap-3">
                      <Avatar name={rec.employees?.full_name || "Employee"} size="sm" />
                      <div>
                        <p className="font-bold text-slate-900">
                          {rec.employees?.full_name || rec.employee_id}
                        </p>
                        <p className="text-[10px] text-purple-700 font-mono font-semibold">
                          {rec.employees?.login_id || "--"}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{rec.date}</td>
                    <td className="px-5 py-3 font-mono font-medium text-emerald-700">
                      {rec.check_in || "--:--:--"}
                    </td>
                    <td className="px-5 py-3 font-mono font-medium text-slate-700">
                      {rec.check_out || (rec.check_in ? "Shift Active" : "--:--:--")}
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
