# HRMS Backend Service (Supabase + FastAPI)

A robust, multi-tenant **Human Resource Management System (HRMS)** backend service built with **Supabase (PostgreSQL + Auth + Storage)** and **FastAPI**.

---

## Features

- **Multi-Tenancy**: Isolated by `company_id` across all database tables.
- **Row Level Security (RLS)**: Enforced directly in PostgreSQL for `admin`, `hr`, and `employee` roles.
- **Auto-Generated Login IDs**: Triggers compute `login_id` in format `{ALIAS}{INITIALS}01{YEAR}{SERIAL}` (e.g. `OEST0120260001`).
- **Auth Wiring**: Company signup, employee onboarding with temporary passwords, and forced password reset on first login.
- **Employee Management**: Profile CRUD, private info (owner/admin/hr restricted), skills, certifications, and admin-only salary management.
- **Attendance & Time Tracking**: Check-in / check-out with server-side duration reconciliation, list views, and automated absent marking job.
- **Time Off Management**: Requests with leave allocation balance validation, Storage attachments for medical certificates, and Admin/HR approval workflows.
- **Payroll Calculation Engine**: Computes payable days, base salary, earnings breakdown, PF/tax deductions, and net pay.

---

## Directory Structure

```
my-hrms-project/
├── backend/
│   ├── main.py              # FastAPI server entry point
│   ├── config.py            # Supabase client configuration
│   ├── routes/              # Modular API routes
│   │   ├── auth.py          # Signup, employee creation, password reset
│   │   ├── employees.py     # Employee profile, private & salary info
│   │   ├── attendance.py    # Check-in/out, hours computation, absent job
│   │   ├── time_off.py      # Requests, balance validation, attachments
│   │   └── payroll.py       # Payable days & salary calculation
│   ├── tests/
│   │   └── test_security.py # Automated security & RLS integration tests
│   ├── requirements.txt     # Python backend dependencies
│   └── package.json         # Node.js alternative manifest
├── database/
│   ├── hrms_schema.sql      # Complete PostgreSQL multi-tenant schema with RLS
│   ├── seed.sql             # Sample testing seed data
│   └── hrms.dp              # Database project file
├── supabase/
│   └── migrations/
│       └── 20260822000000_hrms_schema.sql
├── .env                     # Local environment variables
├── .env.example             # Environment template
└── README.md                # Documentation
```

---

## Environment Setup

1. **Configure Environment Variables**:
   Copy `.env.example` to `.env` (or `backend/.env`) and update with your Supabase credentials:
   ```env
   SUPABASE_URL=https://wtjqcxojeswnkgjqwkol.supabase.co
   SUPABASE_KEY=sb_publishable_NtAoSoQy1c-Vu7BDeojC0Q_UbUOdrTG
   SUPABASE_ANON_KEY=sb_publishable_NtAoSoQy1c-Vu7BDeojC0Q_UbUOdrTG
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   PORT=5000
   ```

2. **Apply Database Migration**:
   - Run `database/hrms_schema.sql` (or `supabase/migrations/20260822000000_hrms_schema.sql`) in your Supabase SQL Editor.
   - Run `database/seed.sql` to populate default attendance schedules and leave types.

3. **Install Dependencies**:
   ```bash
   python -m pip install -r backend/requirements.txt
   ```

---

## Running the Backend Server

Start the FastAPI application server:
```bash
python backend/main.py
```
Or using Uvicorn directly:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 5000 --reload
```
Access the interactive OpenAPI Swagger docs at: `http://localhost:5000/docs`

---

## Running Security Verification Tests

Execute automated integration tests to verify RLS policy enforcement, salary endpoint masking, and role isolation:
```bash
python -m pytest backend/tests/test_security.py
```
