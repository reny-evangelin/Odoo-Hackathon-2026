import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  FileText,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { TimeOffRequest } from "../../types/hrms";
import {
  Button,
  Card,
  Badge,
  Avatar,
  Modal,
  Input,
  cn,
} from "../../components/ui/Primitives";

export const LeaveManagementAdminPage: React.FC = () => {
  const { addToast } = useAuth();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Processing state
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject modal
  const [rejectModalTarget, setRejectModalTarget] = useState<TimeOffRequest | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState("");

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.timeOff.getRequests();
      setRequests(res.time_off_requests || []);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Load Failed",
        message: err.message || "Failed to load leave requests.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await api.timeOff.approveReject(requestId, "approved");
      addToast({
        type: "success",
        title: "Leave Request Approved",
        message: "The time-off allocation balance has been debited.",
      });
      await loadRequests();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Approval Failed",
        message: err.message || "Failed to approve leave request.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalTarget) return;
    setProcessingId(rejectModalTarget.id);
    try {
      await api.timeOff.approveReject(rejectModalTarget.id, "rejected");
      addToast({
        type: "info",
        title: "Leave Request Rejected",
        message: "The employee application has been marked as rejected.",
      });
      setRejectModalTarget(null);
      setRejectReason("");
      await loadRequests();
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Action Failed",
        message: err.message || "Failed to reject leave request.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchStatus = req.status === activeTab;
      const empName = req.employees?.full_name?.toLowerCase() || "";
      const loginId = req.employees?.login_id?.toLowerCase() || "";
      const q = searchQuery.toLowerCase();

      const matchSearch = !searchQuery || empName.includes(q) || loginId.includes(q);
      return matchStatus && matchSearch;
    });
  }, [requests, activeTab, searchQuery]);

  const pendingCount = useMemo(
    () => requests.filter((r) => r.status === "pending").length,
    [requests]
  );

  return (
    <div className="space-y-6">
      {/* Header & Status Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Leave & Time-Off Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorize or reject workforce leave applications, verify medical certificates, and audit allocations.
          </p>
        </div>

        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
          {(["pending", "approved", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer capitalize",
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab === "pending" ? `Pending (${pendingCount})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search by employee name or login ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadRequests}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Requests
          </Button>
        </div>
      </Card>

      {/* Requests List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#7C3AED]" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            No {activeTab} leave requests found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === "pending"
              ? "All employee leave submissions have been processed."
              : `No requests with status ${activeTab} matching current filters.`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <Card
              key={req.id}
              className="p-5 hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <Avatar name={req.employees?.full_name || "Employee"} size="lg" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">
                      {req.employees?.full_name || "Employee"}
                    </h3>
                    <span className="text-xs text-purple-700 font-mono font-semibold">
                      {req.employees?.login_id}
                    </span>
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
                  </div>

                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                    <span className="font-semibold text-slate-900 bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">
                      {req.time_off_types?.name || "Time Off"}
                    </span>
                    <span>
                      Duration: <strong>{req.start_date}</strong> → <strong>{req.end_date}</strong>
                    </span>
                    {req.created_at && (
                      <span className="text-slate-400">
                        Applied: {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {req.reason && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      "{req.reason}"
                    </p>
                  )}

                  {req.attachment_url && (
                    <a
                      href={req.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#7C3AED] hover:underline font-semibold mt-2"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Uploaded Certificate / Document
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {req.status === "pending" && (
                <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={processingId === req.id}
                    onClick={() => setRejectModalTarget(req)}
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 font-semibold"
                    leftIcon={<X className="w-4 h-4" />}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    isLoading={processingId === req.id}
                    onClick={() => handleApprove(req.id)}
                    className="font-semibold"
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    Approve Request
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalTarget && (
        <Modal
          isOpen={Boolean(rejectModalTarget)}
          onClose={() => setRejectModalTarget(null)}
          title="Decline Leave Request"
          description={`Provide comments for rejecting ${rejectModalTarget.employees?.full_name}'s application.`}
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectModalTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={processingId === rejectModalTarget.id}
                onClick={handleConfirmReject}
              >
                Confirm Rejection
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Dates: <strong>{rejectModalTarget.start_date}</strong> to <strong>{rejectModalTarget.end_date}</strong>
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for declining this request..."
              className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
