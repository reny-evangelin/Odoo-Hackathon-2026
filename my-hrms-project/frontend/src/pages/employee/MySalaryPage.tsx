import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Download,
  Printer,
  FileText,
  CreditCard,
  Building,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { PayrollRun } from "../../types/hrms";
import {
  Button,
  Card,
  Badge,
  Modal,
} from "../../components/ui/Primitives";

export const MySalaryPage: React.FC = () => {
  const { user, addToast } = useAuth();
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);

  const loadPayroll = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.payroll.getRuns();
      setRuns(res.payroll_runs || []);
      if (res.payroll_runs && res.payroll_runs.length > 0) {
        setSelectedRun(res.payroll_runs[0]);
      }
    } catch (err: any) {
      console.warn("Payroll load notice:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const latestRun = runs[0] || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            My Salary & Compensation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review monthly pay statements, statutory provident fund deductions, and tax withholdings.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          leftIcon={<Printer className="w-4 h-4" />}
        >
          Print Current Statement
        </Button>
      </div>

      {/* Salary Overview & Payslip Statement */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#7C3AED]" />
        </div>
      ) : latestRun ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Payslip Card */}
          <Card className="p-6 lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  {latestRun.pay_period} Payslip Statement
                </h2>
                <p className="text-xs text-slate-500 font-mono">Run ID: {latestRun.id}</p>
              </div>
              <Badge variant="success" size="md" dot>
                {latestRun.status?.toUpperCase()}
              </Badge>
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-emerald-700 border-b border-slate-100 pb-1.5">
                  Earnings Breakdown (+)
                </h4>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Base Salary</span>
                  <span className="font-semibold text-slate-900">
                    ₹{latestRun.base_salary?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Performance Incentives</span>
                  <span className="font-semibold text-slate-900">
                    ₹{latestRun.bonuses?.toLocaleString() || "0.00"}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                  <span>Gross Pay</span>
                  <span className="text-emerald-700">
                    ₹{((latestRun.base_salary || 0) + (latestRun.bonuses || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-rose-700 border-b border-slate-100 pb-1.5">
                  Statutory Deductions (-)
                </h4>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Provident Fund (PF) & Taxes</span>
                  <span className="font-semibold text-slate-900">
                    ₹{latestRun.deductions?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100 font-bold text-slate-900">
                  <span>Total Deductions</span>
                  <span className="text-rose-700">
                    -₹{latestRun.deductions?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Take Home Pay Highlight */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-900">Net Take-Home Pay</p>
                <p className="text-[11px] text-purple-700">
                  Calculated based on {latestRun.payable_days} / {latestRun.total_days} attended days
                </p>
              </div>
              <h3 className="text-2xl font-black text-[#7C3AED]">
                ₹{latestRun.net_pay?.toLocaleString()}
              </h3>
            </div>
          </Card>

          {/* Direct Deposit Information Card */}
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#7C3AED]" />
                Direct Deposit Account
              </h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">BENEFICIARY</span>
                  <span className="font-bold text-slate-800">{user?.full_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">EMPLOYEE LOGIN ID</span>
                  <span className="font-mono font-bold text-purple-700">{user?.login_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">DISBURSEMENT STATUS</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Direct Bank Transfer
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Payslip Statements Generated Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Your monthly compensation runs will appear here once finalized by the HR/Payroll team.
          </p>
        </Card>
      )}

      {/* Historical Statements List */}
      {runs.length > 1 && (
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Past Payslip Statements</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Pay Period</th>
                  <th className="px-4 py-3">Payable Days</th>
                  <th className="px-4 py-3">Gross Pay</th>
                  <th className="px-4 py-3">Deductions</th>
                  <th className="px-4 py-3">Net Pay</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {runs.slice(1).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">{r.pay_period}</td>
                    <td className="px-4 py-3">{r.payable_days} / {r.total_days} days</td>
                    <td className="px-4 py-3">₹{r.base_salary?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-rose-600">-₹{r.deductions?.toLocaleString()}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">₹{r.net_pay?.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success" size="sm">
                        {r.status}
                      </Badge>
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
