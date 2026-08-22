import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  DollarSign,
  Plus,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Building,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { PayrollRun, EmployeeRecord } from "../../types/hrms";
import {
  Button,
  Card,
  Badge,
  Avatar,
  Modal,
  Input,
  Select,
  cn,
} from "../../components/ui/Primitives";

export const PayrollAdminPage: React.FC = () => {
  const { user, addToast } = useAuth();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compute payroll modal
  const [isComputeModalOpen, setIsComputeModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [payPeriod, setPayPeriod] = useState("2026-08");
  const [totalDays, setTotalDays] = useState(30);
  const [isComputing, setIsComputing] = useState(false);
  const [computeError, setComputeError] = useState("");

  // Selected run for payslip inspection
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [runsRes, empRes] = await Promise.all([
        api.payroll.getRuns(),
        api.employees.list(),
      ]);
      setRuns(runsRes.payroll_runs || []);
      setEmployees(empRes.employees || []);
      if (empRes.employees && empRes.employees.length > 0) {
        setSelectedEmpId(empRes.employees[0].id);
      }
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Load Failed",
        message: err.message || "Failed to load payroll data.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleComputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComputeError("");

    if (!selectedEmpId || !payPeriod) {
      setComputeError("Please select an employee and pay period.");
      return;
    }

    setIsComputing(true);
    try {
      const res = await api.payroll.compute(selectedEmpId, payPeriod, Number(totalDays));
      addToast({
        type: "success",
        title: "Payroll Processed",
        message: res.message || `Payroll calculated for period ${payPeriod}`,
      });
      setIsComputeModalOpen(false);
      await loadData();
    } catch (err: any) {
      setComputeError(err.message || "Failed to compute payroll. Ensure salary is configured.");
    } finally {
      setIsComputing(false);
    }
  };

  const totalDisbursed = useMemo(() => {
    return runs.reduce((acc, r) => acc + (r.net_pay || 0), 0);
  }, [runs]);

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Payroll & Compensation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process monthly payroll runs, compute attendance proration, and generate enterprise payslips.
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
              setIsComputeModalOpen(true);
              setComputeError("");
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Process New Payroll Run
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-purple-500">
          <p className="text-xs font-bold text-slate-500 uppercase">Processed Runs</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{runs.length}</h3>
          <p className="text-[11px] text-purple-600 mt-0.5">Historical disbursement statements</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Net Disbursed</p>
          <h3 className="text-2xl font-black text-emerald-700 mt-1">
            ₹{totalDisbursed.toLocaleString()}
          </h3>
          <p className="text-[11px] text-emerald-600 mt-0.5">Net take-home paid across company</p>
        </Card>
        <Card className="p-5 border-l-4 border-l-cyan-500">
          <p className="text-xs font-bold text-slate-500 uppercase">Active Workforce</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{employees.length}</h3>
          <p className="text-[11px] text-cyan-600 mt-0.5">Eligible employees on payroll</p>
        </Card>
      </div>

      {/* Payroll Runs Table */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Historical Payroll Runs</h3>
          <Badge variant="brand" size="sm">
            {runs.length} Total Records
          </Badge>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#7C3AED]" />
          </div>
        ) : runs.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No payroll runs found</p>
            <p className="text-slate-400 mt-0.5">
              Click "Process New Payroll Run" to calculate compensation for an employee.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Pay Period</th>
                  <th className="px-5 py-3.5">Payable Days</th>
                  <th className="px-5 py-3.5">Gross Pay</th>
                  <th className="px-5 py-3.5">Deductions</th>
                  <th className="px-5 py-3.5">Net Pay</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 flex items-center gap-3">
                      <Avatar name={run.employees?.full_name || "Employee"} size="sm" />
                      <div>
                        <p className="font-bold text-slate-900">
                          {run.employees?.full_name || run.employee_id}
                        </p>
                        <p className="text-[10px] text-purple-700 font-mono font-semibold">
                          {run.employees?.login_id || "--"}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{run.pay_period}</td>
                    <td className="px-5 py-3">
                      {run.payable_days} / {run.total_days} days
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      ₹{run.base_salary?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-rose-600 font-semibold">
                      -₹{run.deductions?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 font-black text-emerald-700 text-sm">
                      ₹{run.net_pay?.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={run.status === "paid" ? "success" : "brand"}
                        size="sm"
                        dot
                      >
                        {run.status?.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedRun(run)}
                        className="text-xs"
                        leftIcon={<FileText className="w-3.5 h-3.5" />}
                      >
                        View Payslip
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Compute Payroll Modal */}
      <Modal
        isOpen={isComputeModalOpen}
        onClose={() => setIsComputeModalOpen(false)}
        title="Compute Employee Payroll"
        description="Select an employee and period to run automated attendance-adjusted payroll calculation."
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsComputeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isComputing}
              onClick={handleComputeSubmit}
            >
              Compute & Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleComputeSubmit} className="space-y-4">
          {computeError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{computeError}</span>
            </div>
          )}

          <Select
            label="Select Employee"
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            options={employees.map((emp) => ({
              label: `${emp.full_name} (${emp.login_id}) - ${emp.department || "General"}`,
              value: emp.id,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Pay Period (YYYY-MM)"
              value={payPeriod}
              onChange={(e) => setPayPeriod(e.target.value)}
              placeholder="e.g. 2026-08"
            />
            <Input
              label="Period Total Days"
              type="number"
              value={totalDays}
              onChange={(e) => setTotalDays(Number(e.target.value))}
            />
          </div>

          <div className="p-3 bg-purple-50 rounded-xl text-purple-900 text-xs border border-purple-100">
            <p className="font-bold">Automated Calculation Formula:</p>
            <p className="text-[11px] text-purple-700 mt-1">
              Payable Days = Total Days - Absent Days. Prorates gross earnings, PF, and statutory taxes.
            </p>
          </div>
        </form>
      </Modal>

      {/* Payslip View Modal */}
      {selectedRun && (
        <Modal
          isOpen={Boolean(selectedRun)}
          onClose={() => setSelectedRun(null)}
          title="Employee Payslip Statement"
          description={`Period: ${selectedRun.pay_period} | ID: ${selectedRun.id}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print / Save PDF
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedRun(null)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-5 p-2 print:p-0">
            {/* Payslip Header */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">{user?.company_name || "Dayflow Enterprise"}</h3>
                <p className="text-xs text-slate-400">Monthly Compensation Statement</p>
              </div>
              <Badge variant="success" size="md">
                {selectedRun.status?.toUpperCase()}
              </Badge>
            </div>

            {/* Employee Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">EMPLOYEE NAME</span>
                <span className="font-bold text-slate-800">
                  {selectedRun.employees?.full_name || selectedRun.employee_id}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">LOGIN ID</span>
                <span className="font-mono font-bold text-purple-700">
                  {selectedRun.employees?.login_id || "--"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">PAY PERIOD</span>
                <span className="font-bold text-slate-800">{selectedRun.pay_period}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px]">PAYABLE DAYS</span>
                <span className="font-bold text-slate-800">
                  {selectedRun.payable_days} / {selectedRun.total_days} Days
                </span>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
                <span>Summary Component</span>
                <span>Calculated Amount</span>
              </div>
              <div className="divide-y divide-slate-100 p-4 space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Gross Calculated Earnings</span>
                  <span className="font-bold text-slate-900">
                    ₹{selectedRun.base_salary?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Performance Bonuses</span>
                  <span className="font-semibold text-slate-900">
                    ₹{selectedRun.bonuses?.toLocaleString() || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Statutory Deductions (PF & Taxes)</span>
                  <span className="font-bold text-rose-600">
                    -₹{selectedRun.deductions?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-3 text-sm font-black border-t border-slate-200 text-slate-900">
                  <span>Net Salary Payable</span>
                  <span className="text-emerald-700">₹{selectedRun.net_pay?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
