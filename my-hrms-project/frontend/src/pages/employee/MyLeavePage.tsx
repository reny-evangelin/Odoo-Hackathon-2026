import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Plus,
  FileText,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import {
  TimeOffType,
  TimeOffAllocation,
  TimeOffRequest,
} from "../../types/hrms";
import {
  Button,
  Card,
  Badge,
  Modal,
  Input,
  Select,
  cn,
} from "../../components/ui/Primitives";

interface MyLeavePageProps {
  isApplyModalOpen?: boolean;
  onCloseApplyModal?: () => void;
}

export const MyLeavePage: React.FC<MyLeavePageProps> = ({
  isApplyModalOpen = false,
  onCloseApplyModal,
}) => {
  const { user, addToast } = useAuth();
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Apply Leave Modal State
  const [isModalOpen, setIsModalOpen] = useState(isApplyModalOpen);
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setIsModalOpen(isApplyModalOpen);
  }, [isApplyModalOpen]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [typeRes, allocRes, reqRes] = await Promise.allSettled([
        api.timeOff.getTypes(),
        api.timeOff.getAllocations(),
        api.timeOff.getRequests(),
      ]);

      if (typeRes.status === "fulfilled") {
        setTypes(typeRes.value.time_off_types || []);
        if (typeRes.value.time_off_types && typeRes.value.time_off_types.length > 0) {
          setSelectedTypeId(typeRes.value.time_off_types[0].id);
        }
      }
      if (allocRes.status === "fulfilled") {
        setAllocations(allocRes.value.allocations || []);
      }
      if (reqRes.status === "fulfilled") {
        setRequests(reqRes.value.time_off_requests || []);
      }
    } catch (err: any) {
      console.error("Leave data load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedTypeObj = useMemo(() => {
    return types.find((t) => t.id === selectedTypeId) || null;
  }, [types, selectedTypeId]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedTypeId || !startDate || !endDate) {
      setFormError("Please select a leave type and valid date range.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setFormError("End date cannot be earlier than start date.");
      return;
    }

    // Check if attachment is required
    if (selectedTypeObj?.requires_attachment && !attachmentFile) {
      setFormError(`A supporting certificate or document is required for ${selectedTypeObj.name}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.timeOff.createRequest(
        selectedTypeId,
        startDate,
        endDate,
        reason.trim() || undefined,
        attachmentFile || undefined
      );

      addToast({
        type: "success",
        title: "Leave Request Submitted",
        message: "Your application has been placed in the management review queue.",
      });

      setIsModalOpen(false);
      if (onCloseApplyModal) onCloseApplyModal();
      setReason("");
      setAttachmentFile(null);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit leave request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build calendar days for current month
  const calendarDays = useMemo(() => {
    const days = [];
    for (let day = 1; day <= 31; day++) {
      const dayStr = `2026-08-${day.toString().padStart(2, "0")}`;
      const dayOfWeek = (day + 5) % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const matchingLeave = requests.find((l) => {
        return l.status === "approved" && dayStr >= l.start_date && dayStr <= l.end_date;
      });

      days.push({
        day,
        dateStr: dayStr,
        isWeekend,
        leave: matchingLeave,
      });
    }
    return days;
  }, [requests]);

  return (
    <div className="space-y-6">
      {/* Header & Apply Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Leave & Time Off
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit time-off requests, check leave allocation balances, and view schedule calendar.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setIsModalOpen(true);
              setFormError("");
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Apply for Leave
          </Button>
        </div>
      </div>

      {/* Leave Allocations Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {allocations.length > 0 ? (
          allocations.map((alloc) => {
            const available = alloc.total_days - alloc.used_days;
            return (
              <Card key={alloc.id} className="p-5 border-l-4 border-l-[#7C3AED]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase">
                    {alloc.time_off_types?.name || "Leave Balance"}
                  </p>
                  <Badge variant="brand" size="sm">
                    {available} Days Left
                  </Badge>
                </div>
                <h3 className="text-3xl font-black text-slate-900 mt-2">
                  {available}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    / {alloc.total_days} total
                  </span>
                </h3>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Used: {alloc.used_days} days</span>
                  <span>Max: {alloc.time_off_types?.max_days_per_year || alloc.total_days} / yr</span>
                </div>
              </Card>
            );
          })
        ) : (
          <>
            <Card className="p-5 border-l-4 border-l-purple-500">
              <p className="text-xs font-bold text-purple-700 uppercase">Paid Leave</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">24 Days</h3>
              <p className="text-[11px] text-purple-600 mt-1">Available for vacation</p>
            </Card>
            <Card className="p-5 border-l-4 border-l-amber-500">
              <p className="text-xs font-bold text-amber-700 uppercase">Sick Leave</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">7 Days</h3>
              <p className="text-[11px] text-amber-600 mt-1">Medical & recovery</p>
            </Card>
            <Card className="p-5 border-l-4 border-l-cyan-500">
              <p className="text-xs font-bold text-cyan-700 uppercase">Casual Leave</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">5 Days</h3>
              <p className="text-[11px] text-cyan-600 mt-1">Short personal time</p>
            </Card>
          </>
        )}
      </div>

      {/* Interactive Monthly Calendar View */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">August 2026 Monthly Schedule</h3>
            <p className="text-xs text-slate-500">Visual leave tracker and holiday schedule</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" /> Approved Leave
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Weekend
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
                "p-2.5 rounded-xl border min-h-[65px] flex flex-col justify-between text-left transition-all",
                item.isWeekend
                  ? "bg-slate-50 border-slate-200/60 text-slate-400"
                  : "bg-white border-slate-200",
                item.leave && "ring-2 ring-purple-400 bg-purple-50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("font-bold text-xs", item.isWeekend ? "text-slate-400" : "text-slate-900")}>
                  {item.day}
                </span>
                {item.day === 22 && (
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED]" title="Today" />
                )}
              </div>
              {item.leave && (
                <div className="mt-1">
                  <span className="block text-[10px] font-bold text-purple-900 bg-purple-100 px-1 py-0.5 rounded truncate">
                    On Leave
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Leave Application History */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">My Leave Applications</h3>
          <Badge variant="brand" size="sm">
            {requests.length} Submissions
          </Badge>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7C3AED]" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No leave requests filed yet. Click "Apply for Leave" above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Leave Type</th>
                  <th className="px-5 py-3.5">Date Range</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Attachment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Applied Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-900">
                      {req.time_off_types?.name || "Time Off"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      {req.start_date} → {req.end_date}
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-xs truncate">
                      {req.reason || "--"}
                    </td>
                    <td className="px-5 py-3">
                      {req.attachment_url ? (
                        <a
                          href={req.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#7C3AED] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Document
                        </a>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          req.status === "approved"
                            ? "success"
                            : req.status === "pending"
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                        dot
                      >
                        {req.status?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {req.created_at ? new Date(req.created_at).toLocaleDateString() : "--"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseApplyModal) onCloseApplyModal();
        }}
        title="Apply for Time Off"
        description="Submit your leave application for manager and HR authorization."
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                if (onCloseApplyModal) onCloseApplyModal();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleApplySubmit}
            >
              Submit Application
            </Button>
          </>
        }
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <Select
            label="Leave Type"
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            options={types.map((t) => ({
              label: `${t.name} (Max: ${t.max_days_per_year} days/yr${t.requires_attachment ? " - Attachment Required" : ""})`,
              value: t.id,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Start Date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="End Date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reason / Justification
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the purpose of your time-off request..."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
            />
          </div>

          {/* Attachment Upload (Required for Sick Leave or when configured) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Supporting Attachment {selectedTypeObj?.requires_attachment ? "*" : "(Optional)"}
            </label>
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center hover:border-purple-300 transition-colors">
              <input
                type="file"
                id="leave-file-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAttachmentFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label
                htmlFor="leave-file-input"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-5 h-5 text-purple-600 mb-1" />
                <span className="text-xs font-bold text-slate-800">
                  {attachmentFile ? attachmentFile.name : "Choose certificate / PDF"}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  PDF, PNG, JPG (Max 5MB)
                </span>
              </label>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
