import React from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Clock,
  Calendar,
  DollarSign,
  Building,
  User,
  LogOut,
  X,
  Layers,
  Shield,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Badge, cn } from "../ui/Primitives";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const isAdminOrHr = user?.role === "admin" || user?.role === "hr";

  const adminNavItems = [
    { id: "admin-dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "admin-employees", label: "Employees", icon: <Users className="w-4 h-4" /> },
    { id: "admin-add-employee", label: "Add Employee", icon: <UserPlus className="w-4 h-4" /> },
    { id: "admin-attendance", label: "Attendance", icon: <Clock className="w-4 h-4" /> },
    { id: "admin-leaves", label: "Leave Management", icon: <Calendar className="w-4 h-4" /> },
    { id: "admin-payroll", label: "Payroll", icon: <DollarSign className="w-4 h-4" /> },
    { id: "admin-company", label: "Company Profile", icon: <Building className="w-4 h-4" /> },
  ];

  const employeeNavItems = [
    { id: "employee-dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "employee-profile", label: "My Profile", icon: <User className="w-4 h-4" /> },
    { id: "employee-attendance", label: "Attendance", icon: <Clock className="w-4 h-4" /> },
    { id: "employee-leaves", label: "Leave / Time Off", icon: <Calendar className="w-4 h-4" /> },
    { id: "employee-salary", label: "Salary Information", icon: <DollarSign className="w-4 h-4" /> },
  ];

  const navItems = isAdminOrHr ? adminNavItems : employeeNavItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              {user?.company_logo_url ? (
                <img
                  src={user.company_logo_url}
                  alt={user.company_name || "Company"}
                  className="w-8 h-8 rounded-lg object-contain bg-white p-0.5"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] text-white flex items-center justify-center font-black shadow-md">
                  <Layers className="w-5 h-5" />
                </div>
              )}
              <div className="truncate">
                <span className="text-sm font-black text-white tracking-tight block truncate">
                  {user?.company_name || "Dayflow HRMS"}
                </span>
                <span className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase block">
                  {isAdminOrHr ? "Admin / HR Portal" : "Employee Portal"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              {isAdminOrHr ? "Enterprise Management" : "Self Service Portal"}
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      onClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                      isActive
                        ? "bg-[#7C3AED] text-white shadow-sm font-bold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                    )}
                  >
                    <span className={isActive ? "text-white" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 truncate">
              <Avatar name={user?.full_name || "User"} size="sm" status="online" />
              <div className="truncate text-left">
                <p className="text-xs font-bold text-white truncate">
                  {user?.full_name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  {user?.login_id || user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
