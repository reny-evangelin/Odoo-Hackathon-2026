import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Sidebar } from "../components/layout/Sidebar";
import { TopNav } from "../components/layout/TopNav";
import { PasswordResetModal } from "../components/shared/PasswordResetModal";
import { ToastContainer } from "../components/shared/ToastContainer";

// Auth Pages
import { LoginPage } from "../pages/auth/LoginPage";

// Admin / HR Pages
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { EmployeesPage } from "../pages/admin/EmployeesPage";
import { AddEmployeePage } from "../pages/admin/AddEmployeePage";
import { AttendanceAdminPage } from "../pages/admin/AttendanceAdminPage";
import { LeaveManagementAdminPage } from "../pages/admin/LeaveManagementAdminPage";
import { PayrollAdminPage } from "../pages/admin/PayrollAdminPage";
import { CompanyProfilePage } from "../pages/admin/CompanyProfilePage";

// Employee Pages
import { EmployeeDashboard } from "../pages/employee/EmployeeDashboard";
import { MyProfilePage } from "../pages/employee/MyProfilePage";
import { MyAttendancePage } from "../pages/employee/MyAttendancePage";
import { MyLeavePage } from "../pages/employee/MyLeavePage";
import { MySalaryPage } from "../pages/employee/MySalaryPage";

// UI Primitives & API exports for backward compatibility
import { Button, Card, Badge, Avatar, Modal, Input, Select, cn } from "../components/ui/Primitives";
import { api, API_BASE_URL } from "../api/client";
import { PunchClockWidget } from "../components/shared/PunchClockWidget";

export const HRMSMainContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [isApplyLeaveModalOpen, setIsApplyLeaveModalOpen] = useState(false);

  // Set default tab based on user role upon login
  useEffect(() => {
    if (user) {
      const isAdminOrHr = user.role === "admin" || user.role === "hr";
      if (!activeTab || (isAdminOrHr && !activeTab.startsWith("admin")) || (!isAdminOrHr && !activeTab.startsWith("employee"))) {
        setActiveTab(isAdminOrHr ? "admin-dashboard" : "employee-dashboard");
      }
    }
  }, [user, activeTab]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] flex items-center justify-center animate-pulse shadow-lg mb-4">
          <span className="font-black text-xl">D</span>
        </div>
        <p className="text-sm font-semibold text-slate-400">Loading Dayflow Enterprise...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  const getPageTitle = () => {
    switch (activeTab) {
      // Admin
      case "admin-dashboard":
        return "Dashboard Overview";
      case "admin-employees":
        return "Employee Management";
      case "admin-add-employee":
        return "Add New Employee";
      case "admin-attendance":
        return "Attendance Management";
      case "admin-leaves":
        return "Leave & Time Off Center";
      case "admin-payroll":
        return "Payroll & Compensation";
      case "admin-company":
        return "Company Profile & Branding";

      // Employee
      case "employee-dashboard":
        return "My Workday Dashboard";
      case "employee-profile":
        return "My Personal Profile";
      case "employee-attendance":
        return "My Attendance Timesheet";
      case "employee-leaves":
        return "Leave & Time Off";
      case "employee-salary":
        return "Salary & Payslips";

      default:
        return "Dayflow HRMS";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
      <div className="flex flex-1 overflow-hidden">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopNav
            pageTitle={getPageTitle()}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-7xl w-full mx-auto">
            {/* ADMIN / HR VIEWS */}
            {activeTab === "admin-dashboard" && (
              <AdminDashboard onNavigate={setActiveTab} />
            )}
            {activeTab === "admin-employees" && (
              <EmployeesPage onNavigateToAdd={() => setActiveTab("admin-add-employee")} />
            )}
            {activeTab === "admin-add-employee" && (
              <AddEmployeePage onSuccessNavigate={() => setActiveTab("admin-employees")} />
            )}
            {activeTab === "admin-attendance" && <AttendanceAdminPage />}
            {activeTab === "admin-leaves" && <LeaveManagementAdminPage />}
            {activeTab === "admin-payroll" && <PayrollAdminPage />}
            {activeTab === "admin-company" && <CompanyProfilePage />}

            {/* EMPLOYEE VIEWS */}
            {activeTab === "employee-dashboard" && (
              <EmployeeDashboard
                onNavigate={setActiveTab}
                onOpenApplyLeave={() => setIsApplyLeaveModalOpen(true)}
              />
            )}
            {activeTab === "employee-profile" && <MyProfilePage />}
            {activeTab === "employee-attendance" && <MyAttendancePage />}
            {activeTab === "employee-leaves" && (
              <MyLeavePage
                isApplyModalOpen={isApplyLeaveModalOpen}
                onCloseApplyModal={() => setIsApplyLeaveModalOpen(false)}
              />
            )}
            {activeTab === "employee-salary" && <MySalaryPage />}
          </main>
        </div>
      </div>

      {/* Forced Password Reset Modal */}
      <PasswordResetModal />

      {/* Global Toast Notifications */}
      <ToastContainer />
    </div>
  );
};

export const HRMSApplication: React.FC = () => {
  return (
    <AuthProvider>
      <HRMSMainContent />
    </AuthProvider>
  );
};

// Aliases and re-exports for compatibility
export const HRMSProvider = AuthProvider;
export const AuthPageView = LoginPage;
export const DashboardView = AdminDashboard;
export const EmployeeDirectoryView = EmployeesPage;
export const AttendanceView = AttendanceAdminPage;
export const LeaveManagementView = LeaveManagementAdminPage;
export const ApprovalCenterView = LeaveManagementAdminPage;
export const PayrollView = PayrollAdminPage;
export const EmployeeProfileDrawer = () => null;
export const dayflowApi = api;
export const TOKENS = {
  colors: {
    brand: { 600: "#7C3AED" },
  },
};

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

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

export function getLeaveDaysCount(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diffDays);
}

export function filterEmployees(
  employees: any[],
  search: string,
  department = "ALL",
  status = "ALL"
): any[] {
  return employees.filter((emp) => {
    const q = search.toLowerCase();
    const matchQuery =
      !search ||
      (emp.full_name && emp.full_name.toLowerCase().includes(q)) ||
      (emp.email && emp.email.toLowerCase().includes(q)) ||
      (emp.login_id && emp.login_id.toLowerCase().includes(q)) ||
      (emp.designation && emp.designation.toLowerCase().includes(q));

    const matchDept = department === "ALL" || emp.department === department;
    const matchStatus = status === "ALL" || emp.status === status;

    return matchQuery && matchDept && matchStatus;
  });
}

export default HRMSApplication;
