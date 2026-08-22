import React from "react";
import { CheckCircle2, XCircle, Sparkles, AlertTriangle, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../ui/Primitives";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAuth();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "p-4 rounded-xl shadow-lg border pointer-events-auto flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-200 bg-white",
            toast.type === "success" && "border-emerald-200 bg-emerald-50/90 text-emerald-950",
            toast.type === "error" && "border-rose-200 bg-rose-50/90 text-rose-950",
            toast.type === "info" && "border-purple-200 bg-purple-50/90 text-purple-950",
            toast.type === "warning" && "border-amber-200 bg-amber-50/90 text-amber-950"
          )}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toast.type === "error" && <XCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          {toast.type === "info" && <Sparkles className="w-5 h-5 text-[#7C3AED] shrink-0" />}
          {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
          <div className="flex-1">
            <h5 className="text-xs font-bold">{toast.title}</h5>
            <p className="text-[11px] opacity-90 mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="opacity-50 hover:opacity-100 p-0.5 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
