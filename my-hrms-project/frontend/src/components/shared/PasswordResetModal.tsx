import React, { useState } from "react";
import { KeyRound, ShieldAlert, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Modal } from "../ui/Primitives";

export const PasswordResetModal: React.FC = () => {
  const { mustResetPassword, resetPassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!mustResetPassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newPassword || !confirmPassword) {
      setErrorMsg("Please fill in both fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirm password do not match.");
      return;
    }

    // Enterprise password strength checks
    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setErrorMsg("Password must contain at least one uppercase letter (A-Z).");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setErrorMsg("Password must contain at least one lowercase letter (a-z).");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setErrorMsg("Password must contain at least one number (0-9).");
      return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword)) {
      setErrorMsg("Password must contain at least one special character (!@#$%^&*).");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(newPassword, confirmPassword);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={mustResetPassword}
      onClose={() => {}} // Disallow closing without resetting
      title="Change Temporary Password"
      description="For your security, you must set a permanent password before accessing Dayflow HRMS."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Initial Setup Password Policy:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-amber-800">
              <li>Minimum 8 characters</li>
              <li>At least 1 uppercase letter (A-Z) & 1 lowercase (a-z)</li>
              <li>At least 1 numeric digit (0-9)</li>
              <li>At least 1 special symbol (!@#$%^&*)</li>
            </ul>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              label="New Password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>

          <Input
            type={showPassword ? "text" : "password"}
            label="Confirm New Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new strong password"
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={logout}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline"
            >
              Sign out instead
            </button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              leftIcon={<KeyRound className="w-4 h-4" />}
            >
              Save Permanent Password
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
