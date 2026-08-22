import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Building,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Shield,
  Eye,
  Edit,
  X,
  RefreshCw,
  CreditCard,
  Lock,
  Save,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import {
  EmployeeRecord,
  EmployeePrivateInfo,
  SalaryInfoResponse,
} from "../../types/hrms";
import {
  Button,
  Card,
  Badge,
  Avatar,
  Input,
  Select,
  Modal,
  cn,
} from "../../components/ui/Primitives";

interface EmployeesPageProps {
  onNavigateToAdd?: () => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({ onNavigateToAdd }) => {
  const { user, addToast } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Selected employee for detail drawer
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<
    "overview" | "private" | "salary"
  >("overview");

  // Private info state for drawer
  const [privateInfo, setPrivateInfo] = useState<EmployeePrivateInfo | null>(null);
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  const [savingPrivate, setSavingPrivate] = useState(false);

  // Private form fields
  const [dob, setDob] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [panNo, setPanNo] = useState("");
  const [aadhaarNo, setAadhaarNo] = useState("");

  // Salary info state for drawer (Admin only)
  const [salaryData, setSalaryData] = useState<SalaryInfoResponse | null>(null);
  const [loadingSalary, setLoadingSalary] = useState(false);
  const [savingSalary, setSavingSalary] = useState(false);
  const [monthWage, setMonthWage] = useState<number>(50000);
  const [workingDays, setWorkingDays] = useState<number>(5);

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.employees.list();
      setEmployees(res.employees || []);
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Load Failed",
        message: err.message || "Failed to load employee list.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const departments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach((e) => {
      if (e.department) depts.add(e.department);
    });
    return ["ALL", ...Array.from(depts)];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        emp.full_name?.toLowerCase().includes(q) ||
        emp.login_id?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.designation?.toLowerCase().includes(q) ||
        emp.department?.toLowerCase().includes(q);

      const matchDept = selectedDept === "ALL" || emp.department === selectedDept;
      const matchStatus = selectedStatus === "ALL" || emp.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchQuery, selectedDept, selectedStatus]);

  // When an employee is selected, load private info and salary info
  const handleOpenDrawer = async (emp: EmployeeRecord) => {
    setSelectedEmployee(emp);
    setActiveDrawerTab("overview");

    // Fetch private info
    setLoadingPrivate(true);
    try {
      const res = await api.employees.getPrivateInfo(emp.id);
      const pi = res.private_info || {};
      setPrivateInfo(pi);
      setDob(pi.date_of_birth || "");
      setMaritalStatus(pi.marital_status || "single");
      setNationality(pi.nationality || "Indian");
      setGender(pi.gender || "prefer_not_to_say");
      setBankName(pi.bank_name || "");
      setAccountNumber(pi.account_number || "");
      setIfscCode(pi.ifsc_code || "");
      setPanNo(pi.pan_no || "");
      setAadhaarNo(pi.aadhaar_no || "");
    } catch (err: any) {
      console.warn("Private info fetch notice:", err);
      setPrivateInfo(null);
    } finally {
      setLoadingPrivate(false);
    }

    // If Admin, fetch salary info
    if (user?.role === "admin") {
      setLoadingSalary(true);
      try {
        const salRes = await api.employees.getSalaryInfo(emp.id);
        setSalaryData(salRes);
        if (salRes.salary_info) {
          setMonthWage(salRes.salary_info.month_wage || 50000);
          setWorkingDays(salRes.salary_info.working_days_per_week || 5);
        }
      } catch (err: any) {
        console.warn("Salary info fetch notice:", err);
        setSalaryData(null);
      } finally {
        setLoadingSalary(false);
      }
    }
  };

  const handleSavePrivateInfo = async () => {
    if (!selectedEmployee) return;
    setSavingPrivate(true);
    try {
      await api.employees.updatePrivateInfo(selectedEmployee.id, {
        date_of_birth: dob,
        marital_status: maritalStatus,
        nationality,
        gender,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
        pan_no: panNo,
        aadhaar_no: aadhaarNo,
      });
      addToast({
        type: "success",
        title: "Private Info Updated",
        message: "Employee banking and personal records updated.",
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Update Failed",
        message: err.message || "Failed to update private info.",
      });
    } finally {
      setSavingPrivate(false);
    }
  };

  const handleSaveSalaryInfo = async () => {
    if (!selectedEmployee) return;
    setSavingSalary(true);
    try {
      const res = await api.employees.updateSalaryInfo(selectedEmployee.id, {
        month_wage: Number(monthWage),
        working_days_per_week: Number(workingDays),
        wage_type: "monthly",
      });
      setSalaryData({
        salary_info: res.salary_info,
        components: res.components,
      });
      addToast({
        type: "success",
        title: "Salary Breakdown Updated",
        message: "Calculated monthly wage components configured.",
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Salary Update Failed",
        message: err.message || "Failed to configure salary.",
      });
    } finally {
      setSavingSalary(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Employee Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage organization employees, inspect detailed profiles, banking info, and compensation structures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-white shadow-xs">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                viewMode === "grid"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
                viewMode === "table"
                  ? "bg-[#7C3AED] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Table
            </button>
          </div>

          {onNavigateToAdd && (
            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToAdd}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, login ID, email, role, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto">
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
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Terminated", value: "terminated" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Directory Grid / Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-[#7C3AED] animate-spin" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching employees</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or department filters to find employees.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEmployees.map((emp) => (
            <Card
              key={emp.id}
              className="p-5 hoverEffect flex flex-col justify-between h-full group"
            >
              <div>
                <div className="flex items-start justify-between">
                  <Avatar name={emp.full_name} size="lg" status="online" />
                  <Badge
                    variant={emp.status === "active" ? "success" : "danger"}
                    size="sm"
                    dot
                  >
                    {emp.status}
                  </Badge>
                </div>

                <div className="mt-3.5">
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors">
                    {emp.full_name}
                  </h4>
                  <p className="text-xs font-medium text-slate-500">{emp.designation || "Staff Member"}</p>
                  <p className="text-xs text-purple-700 font-mono font-bold mt-0.5">
                    {emp.login_id}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.department || "General Department"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDrawer(emp)}
                  className="w-full text-xs font-semibold"
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                  View Details & Profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Login ID</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Designation</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 flex items-center gap-3">
                      <Avatar name={emp.full_name} size="sm" />
                      <div>
                        <p className="font-bold text-slate-900">{emp.full_name}</p>
                        <p className="text-[11px] text-slate-400">{emp.email}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-purple-700">
                      {emp.login_id}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={emp.role === "admin" ? "brand" : emp.role === "hr" ? "info" : "neutral"}
                        size="sm"
                      >
                        {emp.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {emp.department || "General"}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {emp.designation || "Staff"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={emp.status === "active" ? "success" : "danger"}
                        size="sm"
                        dot
                      >
                        {emp.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDrawer(emp)}
                        className="text-xs"
                      >
                        View Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Slide-over Profile Details Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedEmployee(null)}
          />
          <div className="relative w-full max-w-xl bg-white shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <Avatar name={selectedEmployee.full_name} size="xl" status="online" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedEmployee.full_name}
                    </h2>
                    <Badge variant="brand" size="sm">
                      {selectedEmployee.role?.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {selectedEmployee.designation || "Staff Member"} • {selectedEmployee.department || "General"}
                  </p>
                  <p className="text-xs text-purple-700 font-mono font-bold mt-1">
                    Login ID: {selectedEmployee.login_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 px-6 bg-white shrink-0">
              <button
                onClick={() => setActiveDrawerTab("overview")}
                className={cn(
                  "py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer",
                  activeDrawerTab === "overview"
                    ? "border-[#7C3AED] text-[#7C3AED]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveDrawerTab("private")}
                className={cn(
                  "py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer",
                  activeDrawerTab === "private"
                    ? "border-[#7C3AED] text-[#7C3AED]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                Private & Banking Info
              </button>
              {user?.role === "admin" && (
                <button
                  onClick={() => setActiveDrawerTab("salary")}
                  className={cn(
                    "py-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer",
                    activeDrawerTab === "salary"
                      ? "border-[#7C3AED] text-[#7C3AED]"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  Salary Configuration
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* TAB 1: OVERVIEW */}
              {activeDrawerTab === "overview" && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Email Address</span>
                      <span className="font-bold text-slate-800">{selectedEmployee.email}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Phone</span>
                      <span className="font-bold text-slate-800">{selectedEmployee.phone || "--"}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Department</span>
                      <span className="font-bold text-slate-800">{selectedEmployee.department || "General"}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Designation</span>
                      <span className="font-bold text-slate-800">{selectedEmployee.designation || "Staff"}</span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Date Joined</span>
                      <span className="font-bold text-slate-800">
                        {selectedEmployee.joined_date || selectedEmployee.date_of_joining || "2026-08-01"}
                      </span>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[11px]">Account Status</span>
                      <span className="font-bold text-slate-800 capitalize">{selectedEmployee.status}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-purple-900">
                    <h4 className="font-bold text-xs">Security & Identity</h4>
                    <p className="text-[11px] text-purple-700 mt-1">
                      Login ID: <strong className="font-mono">{selectedEmployee.login_id}</strong>
                    </p>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      Password Reset Required:{" "}
                      <strong>{selectedEmployee.must_reset_password ? "Yes (First Login)" : "No (Active)"}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: PRIVATE & BANKING INFO */}
              {activeDrawerTab === "private" && (
                <div className="space-y-4 text-xs">
                  {loadingPrivate ? (
                    <div className="py-10 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7C3AED]" />
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSavePrivateInfo();
                      }}
                      className="space-y-4"
                    >
                      <h4 className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1.5">
                        Personal Background
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Date of Birth"
                          type="date"
                          value={dob}
                          onChange={(e) => setDob(e.target.value)}
                        />
                        <Select
                          label="Marital Status"
                          value={maritalStatus}
                          onChange={(e) => setMaritalStatus(e.target.value)}
                          options={[
                            { label: "Single", value: "single" },
                            { label: "Married", value: "married" },
                            { label: "Divorced", value: "divorced" },
                            { label: "Widowed", value: "widowed" },
                          ]}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Nationality"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                        />
                        <Select
                          label="Gender"
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          options={[
                            { label: "Male", value: "male" },
                            { label: "Female", value: "female" },
                            { label: "Other", value: "other" },
                            { label: "Prefer not to say", value: "prefer_not_to_say" },
                          ]}
                        />
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1.5 pt-2">
                        Banking & Statutory Details
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Bank Name"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. HDFC Bank"
                        />
                        <Input
                          label="Account Number"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Bank account number"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          label="IFSC Code"
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value)}
                          placeholder="HDFC0001234"
                        />
                        <Input
                          label="PAN Number"
                          value={panNo}
                          onChange={(e) => setPanNo(e.target.value)}
                          placeholder="ABCDE1234F"
                        />
                        <Input
                          label="Aadhaar Number"
                          value={aadhaarNo}
                          onChange={(e) => setAadhaarNo(e.target.value)}
                          placeholder="12-digit number"
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={savingPrivate}
                        leftIcon={<Save className="w-3.5 h-3.5" />}
                        className="mt-2"
                      >
                        Save Private Information
                      </Button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 3: SALARY CONFIGURATION (Admin only) */}
              {activeDrawerTab === "salary" && user?.role === "admin" && (
                <div className="space-y-4 text-xs">
                  {loadingSalary ? (
                    <div className="py-10 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7C3AED]" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-900 text-xs mb-2">
                          Configure Monthly Wage Structure
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Monthly Base Wage (INR / USD)"
                            type="number"
                            value={monthWage}
                            onChange={(e) => setMonthWage(Number(e.target.value))}
                          />
                          <Input
                            label="Working Days / Week"
                            type="number"
                            value={workingDays}
                            onChange={(e) => setWorkingDays(Number(e.target.value))}
                          />
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={savingSalary}
                          onClick={handleSaveSalaryInfo}
                          className="mt-3 text-xs"
                          leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                        >
                          Calculate & Save Components
                        </Button>
                      </div>

                      {/* Display Computed Components if Available */}
                      {salaryData?.components && salaryData.components.length > 0 && (
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 mb-2">
                            Current Calculated Breakdown
                          </h4>
                          <div className="space-y-1.5">
                            {salaryData.components.map((comp, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between p-2.5 bg-white rounded-lg border border-slate-100 text-xs"
                              >
                                <span className="font-medium text-slate-700">
                                  {comp.component_name} ({comp.component_type})
                                </span>
                                <span
                                  className={cn(
                                    "font-bold",
                                    comp.component_type === "earning"
                                      ? "text-emerald-700"
                                      : "text-rose-700"
                                  )}
                                >
                                  {comp.component_type === "earning" ? "+" : "-"} ₹
                                  {comp.calculated_amount?.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEmployee(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
