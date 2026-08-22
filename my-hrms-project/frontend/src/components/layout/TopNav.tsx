import React, { useState, useEffect } from "react";
import { Menu, Bell, Calendar, LogOut, Shield, User, Building } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Badge } from "../ui/Primitives";

interface TopNavProps {
  onToggleSidebar: () => void;
  pageTitle: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleSidebar,
  pageTitle,
}) => {
  const { user, logout, addToast } = useAuth();
  const [currentDateStr, setCurrentDateStr] = useState("");

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      setCurrentDateStr(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };
    updateDate();
  }, []);

  const handleNotificationClick = () => {
    addToast({
      type: "info",
      title: "System Notifications",
      message: "You are up to date. All timesheets and payroll cycles are current.",
    });
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 capitalize">
            {pageTitle}
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {user?.company_name || "Enterprise HRMS"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" />
          <span>{currentDateStr}</span>
        </div>

        {/* Notifications Button */}
        <button
          onClick={handleNotificationClick}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 relative cursor-pointer transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7C3AED] ring-2 ring-white" />
        </button>

        {/* User Info Capsule */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <Avatar name={user?.full_name || "User"} size="sm" status="online" />
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800">
                {user?.full_name}
              </span>
              <Badge
                variant={user?.role === "admin" ? "brand" : user?.role === "hr" ? "info" : "neutral"}
                size="sm"
              >
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              {user?.login_id}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
