import React, { useState } from "react";
import { Layers, AlertCircle, Eye, EyeOff, Building, Mail, Lock, User, Phone, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/client";
import { Button, Input, cn } from "../../components/ui/Primitives";

export const LoginPage: React.FC = () => {
  const { login, addToast } = useAuth();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Login form state
  const [identifier, setIdentifier] = useState("OEJD20260001");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Signup form state
  const [companyName, setCompanyName] = useState("");
  const [companyAlias, setCompanyAlias] = useState("");
  const [adminName, setAdminName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!identifier.trim() || !password) {
      setLoginError("Please enter your Login ID or corporate email and password.");
      return;
    }

    setIsLoggingIn(true);
    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      setLoginError(err.message || "Invalid Login ID/Email or password. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");

    if (!companyName.trim() || !adminName.trim() || !signupEmail.trim() || !signupPassword) {
      setSignupError("Please fill in all required company registration fields.");
      return;
    }

    setIsSigningUp(true);
    try {
      const res = await api.auth.signup({
        company_name: companyName.trim(),
        company_alias: companyAlias.trim() || companyName.slice(0, 4).toUpperCase(),
        admin_name: adminName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        phone: signupPhone.trim() || undefined,
      });
      setSignupSuccess(res);
      addToast({
        type: "success",
        title: "Company Registered!",
        message: `Admin Login ID: ${res.login_id}`,
      });
    } catch (err: any) {
      setSignupError(err.message || "Failed to register company.");
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A78BFA] text-white shadow-xl shadow-purple-500/25 mb-4 ring-1 ring-white/20">
          <Layers className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Dayflow</h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">
          Enterprise Human Resource Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {/* Mode Switcher */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              onClick={() => {
                setAuthMode("login");
                setLoginError("");
                setSignupSuccess(null);
              }}
              className={cn(
                "w-1/2 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer",
                authMode === "login"
                  ? "border-[#7C3AED] text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setAuthMode("signup");
                setSignupError("");
                setSignupSuccess(null);
              }}
              className={cn(
                "w-1/2 pb-3 text-sm font-bold border-b-2 text-center transition-all cursor-pointer",
                authMode === "signup"
                  ? "border-[#7C3AED] text-white"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              )}
            >
              Register Company
            </button>
          </div>

          {/* SIGN IN FORM */}
          {authMode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3.5 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Authentication Failed</p>
                    <p className="opacity-90">{loginError}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Login ID or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. OEJD20260001 or admin@company.com"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter your assigned employee Login ID or email address.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded bg-slate-800 border-slate-700 text-[#7C3AED] focus:ring-[#7C3AED]"
                  />
                  <span>Remember my session</span>
                </label>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoggingIn}
                className="w-full mt-3 font-bold bg-[#7C3AED] hover:bg-[#6D28D9] shadow-lg shadow-purple-600/20"
              >
                Sign In to Dayflow
              </Button>
            </form>
          )}

          {/* SIGN UP FORM (Register Company & First Admin) */}
          {authMode === "signup" && (
            <div className="space-y-4">
              {signupSuccess ? (
                <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Company Registered Successfully!</span>
                  </div>
                  <p className="text-xs">
                    Your company <strong>{signupSuccess.company?.name}</strong> has been initialized.
                  </p>
                  <div className="p-3 bg-emerald-900/50 rounded-lg font-mono text-xs text-emerald-100">
                    <p>Generated Admin Login ID: <strong>{signupSuccess.login_id}</strong></p>
                    <p>Admin Email: <strong>{signupEmail}</strong></p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      setIdentifier(signupSuccess.login_id);
                      setPassword(signupPassword);
                      setAuthMode("login");
                      setSignupSuccess(null);
                    }}
                  >
                    Proceed to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSignup} className="space-y-3.5">
                  {signupError && (
                    <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{signupError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Apex Global"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Company Code
                      </label>
                      <input
                        type="text"
                        value={companyAlias}
                        onChange={(e) => setCompanyAlias(e.target.value.toUpperCase())}
                        placeholder="e.g. APEX"
                        maxLength={6}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Primary Admin Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Sarah Connor"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Admin Work Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="sarah@apexglobal.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Admin Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Create secure admin password"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSigningUp}
                    className="w-full mt-2 font-bold bg-[#7C3AED] hover:bg-[#6D28D9]"
                  >
                    Register Company & Setup Admin
                  </Button>
                </form>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Connected to Live Enterprise Database</span>
          </div>
        </div>
      </div>
    </div>
  );
};
