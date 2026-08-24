const { useState, useEffect, useMemo, createContext, useContext } = React;

// --- API Service Helper ---
const API_BASE = '/api';

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);
  
  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'API Request Failed');
  }
  return data;
}

// Initial Data Repository (Stored & Persisted in LocalStorage)
const INITIAL_EMPLOYEES = [
  {
    id: 'emp-101',
    login_id: 'COMPAD0120260001',
    first_name: 'System',
    last_name: 'Admin',
    email: 'admin@acme.com',
    phone: '+1 555-0192',
    role: 'admin',
    department: 'Executive',
    job_title: 'Company Administrator',
    status: 'active',
    date_of_joining: '2024-01-15',
    dob: '1988-06-12',
    gender: 'Male',
    emergency_contact: 'Sarah Vance (+1 555-9922)',
    address: '742 Evergreen Terrace, Springfield',
    nationality: 'American',
    base_salary: 120000,
    hra: 24000,
    allowances: 12000,
    pf_deduction: 6000,
    tax_deduction: 18000,
    net_salary: 132000,
    bank_name: 'Chase Bank',
    account_number: '**** **** 4892',
    documents: [
      { name: 'Executive_Offer_Letter.pdf', date: '2024-01-10', type: 'contract' }
    ]
  },
  {
    id: 'emp-103',
    login_id: 'COMPSD0120260002',
    first_name: 'Marcus',
    last_name: 'Chen',
    email: 'marcus.chen@acme.com',
    phone: '+1 555-0812',
    role: 'employee',
    department: 'Engineering',
    job_title: 'Senior Software Engineer',
    status: 'active',
    date_of_joining: '2024-03-15',
    dob: '1995-11-04',
    gender: 'Male',
    emergency_contact: 'Lin Chen (+1 555-3321)',
    address: '42 Wallaby Way, Sydney',
    nationality: 'Canadian',
    base_salary: 95000,
    hra: 19000,
    allowances: 9000,
    pf_deduction: 4750,
    tax_deduction: 14250,
    net_salary: 104000,
    bank_name: 'Wells Fargo',
    account_number: '**** **** 1134',
    documents: [
      { name: 'Engineering_Contract.pdf', date: '2024-03-10', type: 'contract' }
    ]
  }
];

const INITIAL_ATTENDANCE = [
  { id: 'att-1', employee_id: 'emp-101', employee_name: 'System Admin', work_date: '2026-08-23', check_in: '08:54 AM', check_out: '05:15 PM', work_hours: 8.35, status: 'present' },
  { id: 'att-3', employee_id: 'emp-103', employee_name: 'Marcus Chen', work_date: '2026-08-23', check_in: '09:35 AM', check_out: '--', work_hours: 7.20, status: 'late' }
];

const INITIAL_LEAVE_REQUESTS = [
  { id: 'lv-2', employee_id: 'emp-103', employee_name: 'Marcus Chen', time_off_type: 'Sick Leave', start_date: '2026-08-28', end_date: '2026-08-29', total_days: 2, reason: 'Dental surgery recovery', status: 'pending', attachment: 'medical_note.pdf' }
];

// --- Main App Component ---
function App() {
  // Session & User State
  const [currentUser, setCurrentUser] = useState(null); // null = Page 1 (Login Landing)
  const [authToken, setAuthToken] = useState(null);
  const [companyName, setCompanyName] = useState('Acme Enterprise Solutions');
  
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'attendance', 'timeoff', 'payroll'
  const [isForceResetOpen, setIsForceResetOpen] = useState(false);
  const [isAddEmpOpen, setIsAddEmpOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  // Punch Clock State
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchTime, setPunchTime] = useState('--:--');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Persistent Data Repositories
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('dayflow_employees');
    return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
  });

  const [attendanceLog, setAttendanceLog] = useState(() => {
    const saved = localStorage.getItem('dayflow_attendance');
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [leaveRequests, setLeaveRequests] = useState(() => {
    const saved = localStorage.getItem('dayflow_leaves');
    return saved ? JSON.parse(saved) : INITIAL_LEAVE_REQUESTS;
  });

  const [toastMessage, setToastMessage] = useState(null);

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('dayflow_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('dayflow_attendance', JSON.stringify(attendanceLog));
  }, [attendanceLog]);

  useEffect(() => {
    localStorage.setItem('dayflow_leaves', JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  // Timer Effect for Punch Clock
  useEffect(() => {
    let interval = null;
    if (isPunchedIn) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPunchedIn]);

  // Toast Alert Helper
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle Clock In / Out
  const handlePunchToggle = () => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isPunchedIn) {
      setIsPunchedIn(false);
      showToast(`Clocked Out successfully at ${nowStr}`);
    } else {
      setIsPunchedIn(true);
      setPunchTime(nowStr);
      setElapsedSeconds(0);
      showToast(`Clocked In successfully at ${nowStr}`);
    }
  };

  // Format Timer HH:MM:SS
  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Logout -> Redirect to Page 1 Login Landing
  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setIsPunchedIn(false);
    showToast('Logged out safely. Returned to Page 1 Login Landing');
  };

  // Delete / Remove User (Admin Only)
  const handleDeleteEmployee = (empId) => {
    if (currentUser && currentUser.id === empId) {
      showToast('Cannot delete currently logged-in account', 'error');
      return;
    }
    const empToDelete = employees.find(e => e.id === empId);
    if (!empToDelete) return;

    if (confirm(`Are you sure you want to remove user "${empToDelete.first_name} ${empToDelete.last_name}" (${empToDelete.login_id})?`)) {
      setEmployees(employees.filter(e => e.id !== empId));
      if (selectedEmp && selectedEmp.id === empId) setSelectedEmp(null);
      showToast(`User ${empToDelete.first_name} ${empToDelete.last_name} removed successfully`);
    }
  };

  // PAGE 1: DEDICATED LOGIN / REGISTER LANDING PAGE
  if (!currentUser) {
    return (
      <LoginPage1
        employees={employees}
        onLogin={(user) => {
          setCurrentUser(user);
          setAuthToken('token-' + Date.now());
          if (user.must_reset_password) {
            setIsForceResetOpen(true);
          }
          showToast(`Welcome back, ${user.first_name}! Logged in as ${user.role.toUpperCase()}`);
        }}
        onRegisterCompany={(companyData, adminData) => {
          setCompanyName(companyData.company_name);
          setEmployees([adminData, ...employees]);
          setCurrentUser(adminData);
          showToast(`Company '${companyData.company_name}' registered! Logged in as Admin.`);
        }}
      />
    );
  }

  // Active Role derived strictly from logged-in user profile
  const activeRole = currentUser.role || 'employee';
  const isAdminOrHR = activeRole === 'admin' || activeRole === 'hr';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* --- Top Global Header --- */}
      <header className="h-16 border-b border-slate-800 glass-panel sticky top-0 z-30 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-brand-500/20">
            D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-wide">Dayflow HRMS</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-400 font-medium">Enterprise</span>
            </div>
            <p className="text-xs text-slate-400">{companyName}</p>
          </div>
        </div>

        {/* --- Global Punch Clock & User Profile Bar --- */}
        <div className="flex items-center gap-6">
          
          {/* Quick Punch Clock */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-full px-4 py-1.5 shadow-inner">
            <div className={`w-2.5 h-2.5 rounded-full ${isPunchedIn ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></div>
            <div className="text-xs font-mono">
              <span className="text-slate-400 mr-2">{isPunchedIn ? 'Working:' : 'Clocked Out'}</span>
              <span className="font-bold text-white tracking-wider">{isPunchedIn ? formatTimer(elapsedSeconds) : '--:--:--'}</span>
            </div>
            <button
              onClick={handlePunchToggle}
              className={`text-xs px-3 py-1 rounded-full font-semibold transition-all ${
                isPunchedIn 
                  ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
              }`}
            >
              {isPunchedIn ? 'Punch Out' : 'Punch In'}
            </button>
          </div>

          {/* User Profile Badge & Logout Button */}
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
            <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center font-bold text-brand-300">
              {currentUser.first_name[0]}{currentUser.last_name[0]}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-white">{currentUser.first_name} {currentUser.last_name}</div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span>{currentUser.login_id}</span>
                <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                  activeRole === 'admin' ? 'bg-amber-500/20 text-amber-300' :
                  activeRole === 'hr' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {activeRole}
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="text-xs text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition-all"
              title="Sign Out to Page 1 Login"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* --- Main Body Layout --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* --- Sidebar Navigation --- */}
        <aside className="w-64 border-r border-slate-800 glass-panel p-4 flex flex-col justify-between hidden md:flex">
          <div className="space-y-6">
            
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3">Architecture Modules</div>
            <nav className="space-y-1.5">
              {[
                { id: 'directory', label: isAdminOrHR ? 'Employee Directory' : 'My Profile Record', icon: '👥', badge: isAdminOrHR ? employees.length : 1 },
                { id: 'attendance', label: 'Time & Attendance', icon: '⏱️', badge: 'Live' },
                { id: 'timeoff', label: 'Time Off & Leaves', icon: '📅', badge: leaveRequests.filter(r => r.status === 'pending').length },
                { id: 'payroll', label: 'Payroll Engine', icon: '💰', badge: isAdminOrHR ? 'Admin' : 'Restricted' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === item.id 
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20 font-semibold' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeTab === item.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="pt-4 border-t border-slate-800/80">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Wireframe Security</div>
              <button 
                onClick={() => setIsForceResetOpen(true)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 flex items-center gap-2 font-semibold"
              >
                🔒 Security Password Policy
              </button>
            </div>

          </div>

          {/* Company Metadata Footer */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
            <div className="font-semibold text-slate-300">FastAPI + Supabase backend</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Multi-Tenant RLS Isolated</div>
          </div>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          
          {/* Module 1: Employee Directory */}
          {activeTab === 'directory' && (
            <EmployeeDirectoryView
              employees={employees}
              currentUser={currentUser}
              isAdminOrHR={isAdminOrHR}
              onAddClick={() => setIsAddEmpOpen(true)}
              onSelectEmp={(emp) => setSelectedEmp(emp)}
              onDeleteEmp={handleDeleteEmployee}
            />
          )}

          {/* Module 2: Time & Attendance */}
          {activeTab === 'attendance' && (
            <AttendanceView
              attendanceLog={attendanceLog}
              currentUser={currentUser}
              isAdminOrHR={isAdminOrHR}
              isPunchedIn={isPunchedIn}
              punchTime={punchTime}
              onPunchToggle={handlePunchToggle}
            />
          )}

          {/* Module 3: Time Off / Leave Management */}
          {activeTab === 'timeoff' && (
            <TimeOffView
              leaveRequests={leaveRequests}
              currentUser={currentUser}
              isAdminOrHR={isAdminOrHR}
              onApplyLeave={(newReq) => {
                setLeaveRequests([newReq, ...leaveRequests]);
                showToast('Leave request submitted successfully');
              }}
              onUpdateRequest={(reqId, newStatus) => {
                setLeaveRequests(leaveRequests.map(r => r.id === reqId ? { ...r, status: newStatus } : r));
                showToast(`Leave request marked as ${newStatus.toUpperCase()}`);
              }}
            />
          )}

          {/* Module 4: Payroll Engine */}
          {activeTab === 'payroll' && (
            <PayrollView employees={employees} currentUser={currentUser} isAdminOrHR={isAdminOrHR} />
          )}

        </main>
      </div>

      {/* --- Toast Notification Alert --- */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl glass-panel border font-medium text-sm shadow-2xl flex items-center gap-3 animate-bounce ${
          toastMessage.type === 'error' ? 'border-rose-500/40 text-rose-200' : 'border-emerald-500/40 text-white'
        }`}>
          <span className="text-lg">{toastMessage.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* --- Modals & Drawers --- */}

      {/* 1. Add Employee / Admin Modal */}
      {isAddEmpOpen && (
        <AddEmployeeModal
          companyCode="COMP"
          onClose={() => setIsAddEmpOpen(false)}
          onCreated={(newEmp) => {
            setEmployees([newEmp, ...employees]);
            setIsAddEmpOpen(false);
            showToast(`User ${newEmp.first_name} (${newEmp.role.toUpperCase()}) added with Login ID: ${newEmp.login_id}`);
          }}
        />
      )}

      {/* 2. Employee 4-Tab Detail Drawer */}
      {selectedEmp && (
        <EmployeeDetailDrawer
          employee={selectedEmp}
          currentUser={currentUser}
          isAdminOrHR={isAdminOrHR}
          onClose={() => setSelectedEmp(null)}
          onUpdate={(updated) => {
            setEmployees(employees.map(e => e.id === updated.id ? updated : e));
            setSelectedEmp(updated);
            showToast('User profile details updated successfully');
          }}
        />
      )}

      {/* 3. Forced Password Reset Modal */}
      {isForceResetOpen && (
        <ForcePasswordResetModal
          loginId={currentUser.login_id}
          onClose={() => setIsForceResetOpen(false)}
          onSuccess={() => {
            setIsForceResetOpen(false);
            setCurrentUser({ ...currentUser, must_reset_password: false });
            showToast('Password updated successfully. Account unlocked!');
          }}
        />
      )}

    </div>
  );
}

// ===========================================================================
// PAGE 1: DEDICATED LOGIN / REGISTER LANDING PAGE
// ===========================================================================

function LoginPage1({ employees, onLogin, onRegisterCompany }) {
  const [selectedRoleTab, setSelectedRoleTab] = useState('admin'); // 'admin' or 'employee'
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Quick Demo Logins
  const handleQuickLogin = (role) => {
    const found = employees.find(e => e.role === role) || employees[0];
    onLogin(found);
  };

  const handleFormLogin = (e) => {
    e.preventDefault();
    if (!loginInput || !passwordInput) {
      setErrorMsg('Please enter email/login ID and password');
      return;
    }

    const inputLower = loginInput.trim().toLowerCase();
    const matched = employees.find(e => 
      e.email.toLowerCase() === inputLower || e.login_id.toLowerCase() === inputLower
    );

    if (matched) {
      onLogin(matched);
    } else {
      // Auto-create user for seamless demo login if not found
      const newRole = selectedRoleTab;
      const createdUser = {
        id: `user-${Date.now()}`,
        login_id: `COMP${newRole.slice(0, 2).toUpperCase()}0120260099`,
        first_name: loginInput.split('@')[0] || 'User',
        last_name: 'Account',
        email: loginInput.includes('@') ? loginInput : `${loginInput}@company.com`,
        phone: '+1 555-0100',
        role: newRole,
        department: newRole === 'admin' ? 'Executive' : 'Operations',
        job_title: newRole === 'admin' ? 'Administrator' : 'Staff Member',
        status: 'active',
        date_of_joining: new Date().toISOString().split('T')[0],
        must_reset_password: false,
        base_salary: 80000,
        net_salary: 85000,
        documents: []
      };
      onLogin(createdUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Header */}
      <header className="px-8 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-extrabold text-white text-xl shadow-lg shadow-brand-500/20">
            D
          </div>
          <div>
            <span className="font-bold text-xl text-white tracking-wide">Dayflow HRMS</span>
            <span className="text-xs ml-2 text-slate-400 font-mono">Enterprise Portal</span>
          </div>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          🏢 Register New Company Tenant
        </button>
      </header>

      {/* Main Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to Your Workspace</h2>
            <p className="text-xs text-slate-400">Select login mode to access Admin dashboard or Employee self-service.</p>
          </div>

          {/* Role Selection Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setSelectedRoleTab('admin')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                selectedRoleTab === 'admin'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🔑</span>
              <span>Admin / HR Login</span>
            </button>
            <button
              onClick={() => setSelectedRoleTab('employee')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                selectedRoleTab === 'employee'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>👤</span>
              <span>Employee Login</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormLogin} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 font-semibold mb-1 block">
                {selectedRoleTab === 'admin' ? 'Admin Email / Login ID' : 'Employee Work Email / Login ID'}
              </label>
              <input
                type="text"
                required
                placeholder={selectedRoleTab === 'admin' ? 'admin@acme.com' : 'marcus.chen@acme.com'}
                value={loginInput}
                onChange={e => { setLoginInput(e.target.value); setErrorMsg(''); }}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-semibold mb-1 block">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={passwordInput}
                onChange={e => { setPasswordInput(e.target.value); setErrorMsg(''); }}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-white font-mono focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-xl shadow-brand-600/25 text-sm transition-all"
            >
              Sign In as {selectedRoleTab === 'admin' ? 'Administrator' : 'Employee'} →
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <div className="text-[11px] text-center text-slate-500 font-bold uppercase tracking-wider">Quick Demo One-Click Login</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickLogin('admin')}
                className="py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold text-center"
              >
                🔑 Demo Admin Account
              </button>
              <button
                onClick={() => handleQuickLogin('employee')}
                className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center"
              >
                👤 Demo Employee Account
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900">
        Dayflow HRMS • FastAPI + Supabase Multi-Tenant Architecture
      </footer>

      {/* Register Company Tenant Modal */}
      {isRegisterOpen && (
        <RegisterCompanyModal
          onClose={() => setIsRegisterOpen(false)}
          onRegister={(companyData, adminData) => {
            setIsRegisterOpen(false);
            onRegisterCompany(companyData, adminData);
          }}
        />
      )}

    </div>
  );
}

// Register Company Tenant Modal Component
function RegisterCompanyModal({ onClose, onRegister }) {
  const [compName, setCompName] = useState('');
  const [compAlias, setCompAlias] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!compName || !adminEmail) return;

    const parts = adminName.split(' ');
    const alias = compAlias.trim().toUpperCase() || 'COMP';
    
    const companyData = {
      company_name: compName,
      company_alias: alias
    };

    const adminData = {
      id: `admin-${Date.now()}`,
      login_id: `${alias}AD0120260001`,
      first_name: parts[0] || 'Admin',
      last_name: parts[1] || 'User',
      email: adminEmail,
      phone: '+1 555-0100',
      role: 'admin',
      department: 'Executive',
      job_title: 'Company Founder / Admin',
      status: 'active',
      date_of_joining: new Date().toISOString().split('T')[0],
      must_reset_password: false,
      base_salary: 150000,
      net_salary: 160000,
      documents: []
    };

    onRegister(companyData, adminData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🏢</span>
          <span>Register New Company Tenant</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 font-semibold">Company Name</label>
            <input type="text" required placeholder="Acme Enterprises" value={compName} onChange={e => setCompName(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" />
          </div>

          <div>
            <label className="text-slate-400 font-semibold">Company Alias Code (e.g. ACME)</label>
            <input type="text" required placeholder="ACME" value={compAlias} onChange={e => setCompAlias(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white uppercase font-mono" />
          </div>

          <div>
            <label className="text-slate-400 font-semibold">Administrator Full Name</label>
            <input type="text" required placeholder="Jane Doe" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" />
          </div>

          <div>
            <label className="text-slate-400 font-semibold">Admin Email Address</label>
            <input type="email" required placeholder="admin@acme.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono" />
          </div>

          <div>
            <label className="text-slate-400 font-semibold">Admin Password</label>
            <input type="password" required placeholder="••••••••" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/30">Register & Login Admin</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================================================
// SUB-MODULE 1: EMPLOYEE DIRECTORY & PROFILE DRAWER (WITH PRIVACY SCOPING)
// ===========================================================================

function EmployeeDirectoryView({ employees, currentUser, isAdminOrHR, onAddClick, onSelectEmp, onDeleteEmp }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid');

  // EMPLOYEES CAN ONLY SEE THEIR OWN RECORD! (Admin/HR sees all)
  const visibleEmployees = isAdminOrHR
    ? employees.filter(emp => {
        const matchesSearch = `${emp.first_name} ${emp.last_name} ${emp.login_id} ${emp.job_title} ${emp.email}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter;
        return matchesSearch && matchesDept;
      })
    : employees.filter(emp => emp.id === currentUser.id);

  const departments = ['ALL', ...new Set(employees.map(e => e.department))];

  return (
    <div className="space-y-6">
      
      {/* Privacy Notice Banner for Standard Employees */}
      {!isAdminOrHR && (
        <div className="p-4 bg-brand-500/10 border border-brand-500/25 rounded-2xl text-brand-300 text-xs font-semibold flex items-center gap-3">
          <span className="text-xl">🛡️</span>
          <div>
            <div className="font-bold text-white">Employee Privacy Protection Policy</div>
            <div className="text-[11px] text-slate-300 font-normal">
              You are logged in as a standard employee (<span className="font-mono text-brand-400 font-bold">{currentUser.first_name} {currentUser.last_name}</span>). You can only view and manage your own employee record. Other team members' details are strictly confidential.
            </div>
          </div>
        </div>
      )}

      {/* Header & Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white">
            {isAdminOrHR ? 'Employee Directory' : 'My Employee Profile'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAdminOrHR 
              ? 'Manage workforce profiles, work details, role permissions, and documents.' 
              : 'View your personal work info, private emergency details, and uploaded documents.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Add Employee / Admin Button (Admin/HR only) */}
          {isAdminOrHR && (
            <button
              onClick={onAddClick}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all"
            >
              <span>➕</span>
              <span>Onboard Employee / Admin</span>
            </button>
          )}

          {/* View Toggle */}
          {isAdminOrHR && (
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${viewMode === 'grid' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${viewMode === 'list' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
              >
                List
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar (Admin/HR only) */}
      {isAdminOrHR && (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name, login ID, title, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
          />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
          >
            {departments.map(d => (
              <option key={d} value={d}>Department: {d}</option>
            ))}
          </select>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleEmployees.map(emp => (
            <div
              key={emp.id}
              className="glass-card p-5 rounded-2xl transition-all relative group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectEmp(emp)}>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-lg font-bold text-white shadow-md">
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{emp.first_name} {emp.last_name}</h3>
                    <p className="text-xs text-slate-400">{emp.job_title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                    emp.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    emp.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {emp.role}
                  </span>

                  {/* Remove User Action Button (Admin/HR only) */}
                  {isAdminOrHR && (
                    <button
                      onClick={() => onDeleteEmp(emp.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-all"
                      title="Remove / Delete User"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400 font-mono cursor-pointer" onClick={() => onSelectEmp(emp)}>
                <div className="flex justify-between">
                  <span className="text-slate-500">Login ID:</span>
                  <span className="text-brand-300 font-semibold">{emp.login_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="text-slate-300">{emp.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-300 truncate max-w-[150px]">{emp.email}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 text-right">
                <button onClick={() => onSelectEmp(emp)} className="text-xs text-brand-400 hover:underline font-semibold">
                  Open Profile Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Table View */
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-4">Employee</th>
                <th className="p-4">Login ID</th>
                <th className="p-4">Department</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {visibleEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-900/50">
                  <td className="p-4 flex items-center gap-3 cursor-pointer" onClick={() => onSelectEmp(emp)}>
                    <div className="w-8 h-8 rounded-lg bg-brand-600/30 text-brand-300 flex items-center justify-center font-bold">
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white">{emp.first_name} {emp.last_name}</div>
                      <div className="text-[10px] text-slate-400">{emp.email}</div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-brand-300 font-semibold">{emp.login_id}</td>
                  <td className="p-4 text-slate-300">{emp.department}</td>
                  <td className="p-4 capitalize text-slate-300 font-bold">{emp.role}</td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      emp.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => onSelectEmp(emp)} className="text-brand-400 font-semibold hover:underline">View Profile</button>
                    {isAdminOrHR && (
                      <button onClick={() => onDeleteEmp(emp.id)} className="text-rose-400 hover:text-rose-300 font-semibold">Delete 🗑️</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}

// --- 4-Tab Employee Detail Drawer ---
function EmployeeDetailDrawer({ employee, currentUser, isAdminOrHR, onClose, onUpdate }) {
  const [activeDrawerTab, setActiveDrawerTab] = useState('work');
  const [formData, setFormData] = useState({ ...employee });

  const isSelf = currentUser && currentUser.id === employee.id;
  const canEditSalary = isAdminOrHR;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{employee.first_name} {employee.last_name}</h2>
              <div className="text-xs font-mono text-brand-400">{employee.login_id} • {employee.job_title}</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300">✕</button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6">
          {[
            { id: 'work', label: 'Work Info', icon: '💼' },
            { id: 'private', label: 'Private Info', icon: '🔒' },
            { id: 'salary', label: 'Salary & Bank', icon: '💳' },
            { id: 'documents', label: 'Documents', icon: '📄' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveDrawerTab(tab.id)}
              className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeDrawerTab === tab.id 
                  ? 'border-brand-500 text-brand-400 bg-brand-500/10' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Drawer Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Tab 1: Work Info */}
          {activeDrawerTab === 'work' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-semibold">Department</label>
                  <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Job Title</label>
                  <input type="text" value={formData.job_title} onChange={e => setFormData({ ...formData, job_title: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Work Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Phone Number</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Date of Joining</label>
                  <input type="date" value={formData.date_of_joining} onChange={e => setFormData({ ...formData, date_of_joining: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">System Role</label>
                  <select 
                    disabled={!isAdminOrHR} 
                    value={formData.role} 
                    onChange={e => setFormData({ ...formData, role: e.target.value })} 
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white capitalize disabled:opacity-50"
                  >
                    <option value="employee">Employee</option>
                    <option value="hr">HR Manager</option>
                    <option value="admin">Company Admin</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Private Info */}
          {activeDrawerTab === 'private' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300">
                🛡️ Private Info is protected by Supabase Row-Level Security (RLS).
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 font-semibold">Date of Birth</label>
                  <input type="date" value={formData.dob || '1995-05-15'} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Gender</label>
                  <input type="text" value={formData.gender || 'Male'} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Nationality</label>
                  <input type="text" value={formData.nationality || 'American'} onChange={e => setFormData({ ...formData, nationality: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold">Emergency Contact</label>
                  <input type="text" value={formData.emergency_contact || '+1 555-0999'} onChange={e => setFormData({ ...formData, emergency_contact: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>
                <div className="col-span-2">
                  <label className="text-slate-400 font-semibold">Residential Address</label>
                  <textarea value={formData.address || '123 Tech Way'} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" rows={2} />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Salary & Bank Info */}
          {activeDrawerTab === 'salary' && (
            <div className="space-y-4 text-xs">
              {!canEditSalary && !isSelf ? (
                <div className="p-6 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300">
                  🚫 Access Restricted. Salary details are only accessible to Administrators and HR Managers.
                </div>
              ) : (
                <>
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-slate-400">Monthly Net Payable Salary</div>
                      <div className="text-2xl font-bold font-mono text-emerald-400">${((formData.net_salary || 90000) / 12).toFixed(2)} / mo</div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Verified</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 font-semibold">Annual Base Salary ($)</label>
                      <input type="number" disabled={!isAdminOrHR} value={formData.base_salary || 85000} onChange={e => setFormData({ ...formData, base_salary: parseFloat(e.target.value) })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold">House Rent Allowance (HRA)</label>
                      <input type="number" disabled={!isAdminOrHR} value={formData.hra || 18000} onChange={e => setFormData({ ...formData, hra: parseFloat(e.target.value) })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold">Bank Name</label>
                      <input type="text" value={formData.bank_name || 'Chase Bank'} onChange={e => setFormData({ ...formData, bank_name: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white" />
                    </div>
                    <div>
                      <label className="text-slate-400 font-semibold">Account Number</label>
                      <input type="text" value={formData.account_number || '**** **** 4892'} onChange={e => setFormData({ ...formData, account_number: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab 4: Documents */}
          {activeDrawerTab === 'documents' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-300">Uploaded Employee Documents</span>
                <button className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold">Upload File 📤</button>
              </div>

              <div className="space-y-2">
                {formData.documents && formData.documents.length > 0 ? (
                  formData.documents.map((doc, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <div className="font-bold text-white">{doc.name}</div>
                          <div className="text-[10px] text-slate-400">Uploaded {doc.date} • Type: {doc.type}</div>
                        </div>
                      </div>
                      <button className="text-brand-400 hover:underline">Download</button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                    No documents uploaded yet.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Cancel</button>
          <button onClick={() => onUpdate(formData)} className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30">Save Changes</button>
        </div>

      </div>
    </div>
  );
}

// --- Add Employee / Admin Modal ---
function AddEmployeeModal({ companyCode, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('employee'); // 'employee', 'hr', 'admin'
  const [phone, setPhone] = useState('');
  const [dept, setDept] = useState('Engineering');

  const computedLoginId = `${companyCode}${role.slice(0, 2).toUpperCase()}${name.slice(0, 2).toUpperCase() || 'XX'}2026${Math.floor(1000 + Math.random() * 9000)}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;
    const parts = name.split(' ');
    const newEmp = {
      id: `emp-${Date.now()}`,
      login_id: computedLoginId,
      first_name: parts[0],
      last_name: parts[1] || 'User',
      email,
      phone,
      role, // Can create either 'employee', 'hr', or 'admin'
      department: dept,
      job_title: role === 'admin' ? 'Company Administrator' : (role === 'hr' ? 'HR Manager' : 'Team Member'),
      status: 'active',
      date_of_joining: new Date().toISOString().split('T')[0],
      must_reset_password: true,
      base_salary: role === 'admin' ? 120000 : 80000,
      net_salary: role === 'admin' ? 130000 : 85000,
      documents: []
    };
    onCreated(newEmp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>👥</span>
          <span>Add New User (Employee or Admin)</span>
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 font-semibold">Full Name</label>
            <input type="text" required placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" />
          </div>

          <div>
            <label className="text-slate-400 font-semibold">Email Address</label>
            <input type="email" required placeholder="john.doe@company.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold">System Role</label>
              <select value={role} onChange={e => setRole(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-bold">
                <option value="employee">👤 Employee</option>
                <option value="hr">👔 HR Manager</option>
                <option value="admin">🔑 Company Admin</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 font-semibold">Department</label>
              <select value={dept} onChange={e => setDept(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white">
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Executive">Executive</option>
                <option value="Design">Design</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
          </div>

          {/* Auto Generated Login ID Preview */}
          <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl font-mono text-brand-300 flex justify-between items-center">
            <span>Generated Login ID:</span>
            <span className="font-bold">{computedLoginId}</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/30">Create Account</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================================================
// SUB-MODULE 2: TIME & ATTENDANCE TRACKER
// ===========================================================================

function AttendanceView({ attendanceLog, currentUser, isAdminOrHR, isPunchedIn, punchTime, onPunchToggle }) {
  // Employees only see their own attendance records
  const visibleAttendance = isAdminOrHR
    ? attendanceLog
    : attendanceLog.filter(log => log.employee_id === currentUser.id);

  return (
    <div className="space-y-6">
      
      {/* Attendance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Present Today</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">1 / 1</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">✅</div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Late Check-Ins</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">0</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl">⚠️</div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">On Leave</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1">0</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl">🏖️</div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Absent</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">0</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-xl">🚫</div>
        </div>
      </div>

      {/* Main Punch Clock Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-block px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 font-semibold text-xs border border-brand-500/30 mb-1">
            Shift Schedule: Standard (09:00 AM - 05:00 PM)
          </div>
          <h3 className="text-xl font-bold text-white">Live Time & Attendance Console</h3>
          <p className="text-xs text-slate-400">Punch in or clock out for employee <span className="font-bold text-brand-300">{currentUser.first_name} {currentUser.last_name}</span>.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right font-mono">
            <div className="text-xs text-slate-400">Punch Status</div>
            <div className="text-base font-bold text-white">{isPunchedIn ? `Checked In (${punchTime})` : 'Clocked Out'}</div>
          </div>
          <button
            onClick={onPunchToggle}
            className={`px-6 py-3 rounded-xl font-bold text-sm shadow-xl transition-all ${
              isPunchedIn
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isPunchedIn ? 'Punch Out Now' : 'Clock In Now'}
          </button>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
          <h4 className="font-bold text-white text-sm">
            {isAdminOrHR ? 'Attendance Log & Overtime Tracker' : 'My Attendance Log'}
          </h4>
          <input type="date" defaultValue="2026-08-23" className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white" />
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">Employee</th>
              <th className="p-4">Check In</th>
              <th className="p-4">Check Out</th>
              <th className="p-4">Total Hours</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {visibleAttendance.map(log => (
              <tr key={log.id} className="hover:bg-slate-900/50">
                <td className="p-4 text-slate-400">{log.work_date}</td>
                <td className="p-4 font-sans font-bold text-white">{log.employee_name}</td>
                <td className="p-4 text-emerald-400">{log.check_in}</td>
                <td className="p-4 text-amber-400">{log.check_out}</td>
                <td className="p-4 text-white font-bold">{log.work_hours > 0 ? `${log.work_hours} hrs` : '--'}</td>
                <td className="p-4">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                    log.status === 'present' ? 'bg-emerald-500/20 text-emerald-400' : 
                    log.status === 'late' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

// ===========================================================================
// SUB-MODULE 3: TIME OFF (LEAVE) MANAGEMENT & CALENDAR
// ===========================================================================

function TimeOffView({ leaveRequests, currentUser, isAdminOrHR, onApplyLeave, onUpdateRequest }) {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Employees only see their own leave requests
  const visibleLeaves = isAdminOrHR
    ? leaveRequests
    : leaveRequests.filter(req => req.employee_id === currentUser.id);

  return (
    <div className="space-y-6">
      
      {/* Leave Balance Allocation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase">Paid Time Off (PTO)</span>
            <span className="text-xs font-mono font-bold text-emerald-400">18 / 24 Days Left</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase">Sick Leave</span>
            <span className="text-xs font-mono font-bold text-amber-400">5 / 7 Days Left</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '71%' }}></div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase">Casual / Unpaid Leave</span>
            <span className="text-xs font-mono font-bold text-indigo-400">12 Days Used</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '40%' }}></div>
          </div>
        </div>
      </div>

      {/* Control Action Banner */}
      <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white">
            {isAdminOrHR ? 'Employee Leave Approvals & Requests' : 'My Leave Requests'}
          </h3>
          <p className="text-xs text-slate-400">
            {isAdminOrHR 
              ? 'Review, approve, or reject employee leave applications.' 
              : 'Submit time off applications for manager approval.'}
          </p>
        </div>
        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center gap-2"
        >
          <span>🌴</span>
          <span>Apply Leave</span>
        </button>
      </div>

      {/* Requests Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="p-4">Employee</th>
              <th className="p-4">Leave Type</th>
              <th className="p-4">Dates</th>
              <th className="p-4">Days</th>
              <th className="p-4">Reason</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {visibleLeaves.map(req => (
              <tr key={req.id} className="hover:bg-slate-900/50">
                <td className="p-4 font-bold text-white">{req.employee_name}</td>
                <td className="p-4 text-slate-300 font-semibold">{req.time_off_type}</td>
                <td className="p-4 font-mono text-slate-400">{req.start_date} → {req.end_date}</td>
                <td className="p-4 font-mono font-bold text-brand-300">{req.total_days} days</td>
                <td className="p-4 text-slate-300">{req.reason}</td>
                <td className="p-4">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                    req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                    req.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {/* Approve / Reject Actions (ADMIN / HR ONLY) */}
                  {req.status === 'pending' && isAdminOrHR ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => onUpdateRequest(req.id, 'approved')} className="px-3 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/30 font-bold">Approve ✓</button>
                      <button onClick={() => onUpdateRequest(req.id, 'rejected')} className="px-3 py-1 rounded-lg bg-rose-600/30 text-rose-300 hover:bg-rose-600/50 border border-rose-500/30 font-bold">Reject ✕</button>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-[10px]">
                      {req.status === 'pending' ? 'Pending Admin Review' : `Completed (${req.status})`}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Monthly Interactive Leave Calendar View */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <span>📅</span>
          <span>Team Leave Calendar (August 2026)</span>
        </h4>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="p-2 text-slate-500 font-bold uppercase">{d}</div>
          ))}
          {Array.from({ length: 31 }).map((_, i) => {
            const dayNum = i + 1;
            const isOnLeave = dayNum >= 28 && dayNum <= 29;
            return (
              <div key={dayNum} className={`p-3 min-h-[60px] rounded-xl border text-left flex flex-col justify-between ${
                isOnLeave 
                  ? 'bg-brand-600/20 border-brand-500/40 text-brand-200' 
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
              }`}>
                <span className="font-bold text-[10px]">{dayNum}</span>
                {isOnLeave && (
                  <span className="text-[9px] bg-brand-500/30 px-1.5 py-0.5 rounded text-white truncate font-sans">Marcus (Sick)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Apply Leave Modal */}
      {isApplyModalOpen && (
        <ApplyLeaveModal
          currentUser={currentUser}
          onClose={() => setIsApplyModalOpen(false)}
          onSubmit={(req) => {
            onApplyLeave(req);
            setIsApplyModalOpen(false);
          }}
        />
      )}

    </div>
  );
}

function ApplyLeaveModal({ currentUser, onClose, onSubmit }) {
  const [type, setType] = useState('Paid Time Off');
  const [start, setStart] = useState('2026-09-01');
  const [end, setEnd] = useState('2026-09-03');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      id: `lv-${Date.now()}`,
      employee_id: currentUser.id,
      employee_name: `${currentUser.first_name} ${currentUser.last_name}`,
      time_off_type: type,
      start_date: start,
      end_date: end,
      total_days: 3,
      reason,
      status: 'pending'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>🌴</span>
          <span>Apply for Time Off</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 font-semibold">Leave Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white">
              <option value="Paid Time Off">Paid Time Off (PTO)</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-semibold">Start Date</label>
              <input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" />
            </div>
            <div>
              <label className="text-slate-400 font-semibold">End Date</label>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-semibold">Reason for Leave</label>
            <textarea required rows={3} placeholder="Describe reason..." value={reason} onChange={e => setReason(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" />
          </div>

          <div>
            <label className="text-slate-400 font-semibold">Medical / Attachment (Optional)</label>
            <input type="file" className="w-full mt-1 text-slate-400 bg-slate-800 p-2 rounded-xl border border-slate-700" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/30">Submit Application</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===========================================================================
// SUB-MODULE 4: PAYROLL ENGINE
// ===========================================================================

function PayrollView({ employees, currentUser, isAdminOrHR }) {
  if (!isAdminOrHR) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center border border-rose-500/30 space-y-4 max-w-lg mx-auto my-12">
        <div className="text-4xl">🔒</div>
        <h3 className="text-xl font-bold text-white">Access Restricted</h3>
        <p className="text-xs text-slate-400">
          The Payroll Calculation Engine is restricted to Administrators and HR Managers. Please log in as an Admin account to process payroll runs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white">Automated Payroll Calculation Engine</h3>
          <p className="text-xs text-slate-400">Computes base pay, payable days, PF/tax deductions, and net salary disbursement.</p>
        </div>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/30">
          Process Payroll Run 🚀
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="p-4">User / Employee</th>
              <th className="p-4">Role</th>
              <th className="p-4">Annual Base</th>
              <th className="p-4">Monthly Gross</th>
              <th className="p-4">Deductions</th>
              <th className="p-4">Net Monthly Pay</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-900/50">
                <td className="p-4 font-sans font-bold text-white">{emp.first_name} {emp.last_name}</td>
                <td className="p-4 capitalize text-brand-300 font-bold">{emp.role}</td>
                <td className="p-4 text-slate-300">${emp.base_salary.toLocaleString()}</td>
                <td className="p-4 text-indigo-400">${(emp.base_salary / 12).toFixed(2)}</td>
                <td className="p-4 text-rose-400">-${(((emp.pf_deduction || 6000) + (emp.tax_deduction || 18000)) / 12).toFixed(2)}</td>
                <td className="p-4 text-emerald-400 font-bold text-sm">${((emp.net_salary || 85000) / 12).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===========================================================================
// SUB-MODULE 5: SECURITY FORCED PASSWORD RESET MODAL
// ===========================================================================

function ForcePasswordResetModal({ loginId, onClose, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleReset = (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter and digit');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 font-semibold flex items-center gap-2">
          <span>🔒</span>
          <span>Security Policy Password Reset</span>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Reset Temporary Password</h3>
          <p className="text-slate-400 text-xs mt-1">Account <span className="font-mono text-brand-400 font-bold">{loginId}</span> requires password initialization.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 font-semibold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-slate-400 font-semibold">New Strong Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setError(''); }}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-brand-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-semibold">Confirm Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold shadow-lg shadow-brand-600/30">Update Password</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Render Main App Component
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
