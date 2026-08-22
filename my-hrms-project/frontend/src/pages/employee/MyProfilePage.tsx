import React, { useState, useEffect, useCallback } from "react";
import {
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Lock,
  Save,
  KeyRound,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { EmployeePrivateInfo } from "../../types/hrms";
import {
  Button,
  Card,
  Badge,
  Avatar,
  Input,
  Select,
} from "../../components/ui/Primitives";

export const MyProfilePage: React.FC = () => {
  const { user, addToast, resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPrivate, setIsSavingPrivate] = useState(false);

  // Private info form
  const [dob, setDob] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("single");
  const [nationality, setNationality] = useState("Indian");
  const [gender, setGender] = useState("prefer_not_to_say");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [panNo, setPanNo] = useState("");
  const [aadhaarNo, setAadhaarNo] = useState("");

  // Change Password Form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState("");

  const loadPrivateInfo = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await api.employees.getPrivateInfo(user.id);
      const pi = res.private_info || {};
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
      console.warn("Private info load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPrivateInfo();
  }, [loadPrivateInfo]);

  const handleSavePrivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSavingPrivate(true);
    try {
      await api.employees.updatePrivateInfo(user.id, {
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
        title: "Profile Updated",
        message: "Your personal and banking details have been saved.",
      });
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Update Failed",
        message: err.message || "Failed to update profile.",
      });
    } finally {
      setIsSavingPrivate(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");

    if (!newPassword || !confirmPassword) {
      setPassError("Please provide both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPassError("Password must be at least 8 characters long.");
      return;
    }

    setIsChangingPass(true);
    try {
      await resetPassword(newPassword, confirmPassword);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPassError(err.message || "Failed to update password.");
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          My Profile & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review personal background, statutory banking records for payroll deposit, and security settings.
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user?.full_name || "Employee"} size="xl" status="online" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
              <Badge variant="brand" size="sm">
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {user?.designation || "Staff Member"} • {user?.department || "General"}
            </p>
            <p className="text-xs text-purple-700 font-mono font-bold mt-1">
              Login ID: {user?.login_id}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 sm:text-right space-y-1">
          <p>
            Corporate Email: <strong className="text-slate-800">{user?.email}</strong>
          </p>
          <p>
            Company: <strong className="text-slate-800">{user?.company_name || "Enterprise"}</strong>
          </p>
        </div>
      </Card>

      {/* Private Information & Banking Form */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#7C3AED]" />
          Personal & Banking Information (Payroll Deposit)
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#7C3AED]" />
          </div>
        ) : (
          <form onSubmit={handleSavePrivate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nationality"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="e.g. Indian"
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

            <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1 pt-3">
              Direct Deposit Bank Account Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Bank Name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India / HDFC"
              />
              <Input
                label="Bank Account Number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter account number"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="IFSC Code"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. SBIN0001234"
              />
              <Input
                label="PAN Card Number"
                value={panNo}
                onChange={(e) => setPanNo(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
              />
              <Input
                label="Aadhaar Card Number"
                value={aadhaarNo}
                onChange={(e) => setAadhaarNo(e.target.value)}
                placeholder="12-digit Aadhaar"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingPrivate}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Security & Password Settings */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#7C3AED]" />
          Account Security & Password
        </h3>

        {passError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{passError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Input
            type="password"
            label="New Password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter at least 8 characters"
          />
          <Input
            type="password"
            label="Confirm New Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
          />

          <Button
            type="submit"
            variant="outline"
            size="sm"
            isLoading={isChangingPass}
            leftIcon={<KeyRound className="w-3.5 h-3.5" />}
          >
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
};
