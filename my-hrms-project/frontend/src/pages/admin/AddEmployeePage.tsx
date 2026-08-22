import React, { useState } from "react";
import {
  UserPlus,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  KeyRound,
  Shield,
  Building,
  Mail,
  User,
  Briefcase,
  Phone,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { AddEmployeeResult } from "../../types/hrms";
import { Button, Input, Select, Card, Modal, Badge } from "../../components/ui/Primitives";

interface AddEmployeePageProps {
  onSuccessNavigate?: () => void;
}

export const AddEmployeePage: React.FC<AddEmployeePageProps> = ({
  onSuccessNavigate,
}) => {
  const { user, addToast } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"employee" | "hr" | "admin">("employee");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [designation, setDesignation] = useState("Software Engineer");
  const [companyName, setCompanyName] = useState(user?.company_name || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<AddEmployeeResult | null>(null);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim() || !email.trim()) {
      setErrorMsg("Employee Full Name and Corporate Email are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.auth.addEmployee({
        company_id: user?.company_id,
        company_name: companyName.trim() || user?.company_name,
        full_name: fullName.trim(),
        email: email.trim(),
        role: role,
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        designation: designation.trim() || undefined,
      });

      setResult(res);
      setIsCredentialsModalOpen(true);
      addToast({
        type: "success",
        title: "Employee Created",
        message: `Account generated for ${fullName} with Login ID: ${res.login_id}`,
      });

      // Reset form
      setFullName("");
      setEmail("");
      setPhone("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create employee account.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Add New Employee
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Provision a secure enterprise account. The system will auto-calculate the sequential Login ID and high-entropy temporary password.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Error Creating Employee</p>
              <p className="opacity-90">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Identity */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#7C3AED]" />
              Basic Identity & Account Info
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alexander Pierce"
                leftIcon={<User className="w-4 h-4 text-slate-400" />}
              />
              <Input
                label="Corporate Email Address"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alexander@company.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />
            </div>
          </div>

          {/* Section 2: Role & Department */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#7C3AED]" />
              Organizational Role & Department
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="System Role / Permissions"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                options={[
                  { label: "Standard Employee", value: "employee" },
                  { label: "HR Officer", value: "hr" },
                  { label: "Company Administrator", value: "admin" },
                ]}
              />

              <Input
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering, Sales, HR"
                leftIcon={<Building className="w-4 h-4 text-slate-400" />}
              />

              <Input
                label="Designation / Title"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>
          </div>

          {/* Section 3: Contact & Company Meta */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#7C3AED]" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
              />
              <Input
                label="Company Tenant Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name"
                disabled
                helperText="Scoped to current authenticated company tenant"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            {onSuccessNavigate && (
              <Button
                type="button"
                variant="outline"
                onClick={onSuccessNavigate}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Generate Account Credentials
            </Button>
          </div>
        </form>
      </Card>

      {/* Generated Credentials Success Modal */}
      {result && (
        <Modal
          isOpen={isCredentialsModalOpen}
          onClose={() => setIsCredentialsModalOpen(false)}
          title="Employee Account Created Successfully"
          description="Please copy and securely deliver these one-time login credentials to the employee."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-500">
                Employee will be prompted to change password on first login.
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsCredentialsModalOpen(false);
                  if (onSuccessNavigate) onSuccessNavigate();
                }}
              >
                Done & Return to Directory
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Account Provisioned!</p>
                <p className="text-emerald-700">
                  Profile registered for <strong>{result.employee.full_name}</strong> ({result.employee.email}).
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-900 text-white p-5 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Temporary Access Credentials
              </h4>

              {/* Login ID */}
              <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    GENERATED LOGIN ID
                  </span>
                  <span className="font-mono text-base font-bold text-white tracking-wide">
                    {result.login_id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(result.login_id, "login_id")}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedField === "login_id" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>

              {/* Temporary Password */}
              {result.temporary_password && (
                <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      TEMPORARY PASSWORD (CSPRNG 12-CHAR)
                    </span>
                    <span className="font-mono text-base font-bold text-amber-400 tracking-wide">
                      {result.temporary_password}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(result.temporary_password || "", "password")}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedField === "password" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Password</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                <span>Encrypted via Bcrypt in identity provider. Zero plaintext stored in DB.</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
