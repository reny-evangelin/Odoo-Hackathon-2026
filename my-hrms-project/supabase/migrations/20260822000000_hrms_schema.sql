-- Supabase migration file for HRMS Schema
-- Copy of database/hrms_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_event_type AS ENUM ('check_in', 'check_out');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attendance_record_status AS ENUM ('present', 'absent', 'half_day', 'on_leave');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE time_off_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payroll_status AS ENUM ('draft', 'processed', 'paid');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE wage_type AS ENUM ('fixed', 'hourly', 'monthly');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE component_type AS ENUM ('earning', 'deduction');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE computation_type AS ENUM ('fixed_amount', 'percentage_of_wage');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- TABLES
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    alias TEXT NOT NULL DEFAULT 'COMP',
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    auth_id UUID UNIQUE,
    login_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'employee',
    status employee_status NOT NULL DEFAULT 'active',
    joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
    joining_year INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    joining_serial INT NOT NULL DEFAULT 1,
    must_reset_password BOOLEAN NOT NULL DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_private_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    date_of_birth DATE,
    marital_status TEXT,
    nationality TEXT,
    gender TEXT,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    pan_no TEXT,
    aadhaar_no TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    certification_name TEXT NOT NULL,
    issued_by TEXT,
    issue_date DATE
);

CREATE TABLE IF NOT EXISTS employee_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    resume_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Standard Schedule',
    work_start_time TIME NOT NULL DEFAULT '09:00:00',
    work_end_time TIME NOT NULL DEFAULT '17:00:00',
    working_days_per_week INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    event_type attendance_event_type NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    work_hours NUMERIC(5,2) DEFAULT 0,
    extra_hours NUMERIC(5,2) DEFAULT 0,
    status attendance_record_status NOT NULL DEFAULT 'present',
    CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);

CREATE TABLE IF NOT EXISTS time_off_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    requires_attachment BOOLEAN NOT NULL DEFAULT false,
    max_days_per_year NUMERIC(5,2) NOT NULL DEFAULT 24
);

CREATE TABLE IF NOT EXISTS time_off_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_off_type_id UUID NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
    total_days NUMERIC(5,2) NOT NULL DEFAULT 24,
    used_days NUMERIC(5,2) NOT NULL DEFAULT 0,
    CONSTRAINT unique_employee_time_off_type UNIQUE (employee_id, time_off_type_id)
);

CREATE TABLE IF NOT EXISTS time_off_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    time_off_type_id UUID NOT NULL REFERENCES time_off_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    attachment_url TEXT,
    status time_off_status NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES employees(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    month_wage NUMERIC(12,2) NOT NULL DEFAULT 0,
    yearly_wage NUMERIC(12,2) NOT NULL DEFAULT 0,
    working_days_per_week INT NOT NULL DEFAULT 5,
    wage_type wage_type NOT NULL DEFAULT 'monthly',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_id UUID NOT NULL REFERENCES salary_info(id) ON DELETE CASCADE,
    component_name TEXT NOT NULL,
    component_type component_type NOT NULL,
    computation_type computation_type NOT NULL,
    value NUMERIC(10,4) NOT NULL,
    calculated_amount NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    pay_period TEXT NOT NULL,
    total_days INT NOT NULL DEFAULT 30,
    payable_days NUMERIC(5,2) NOT NULL DEFAULT 30,
    base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
    bonuses NUMERIC(12,2) NOT NULL DEFAULT 0,
    deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
    status payroll_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION next_joining_serial(p_company_id UUID, p_year INT)
RETURNS INT AS $$
DECLARE
    v_next_serial INT;
BEGIN
    SELECT COALESCE(MAX(joining_serial), 0) + 1
    INTO v_next_serial
    FROM employees
    WHERE company_id = p_company_id AND joining_year = p_year;

    RETURN v_next_serial;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_login_id(
    p_company_alias TEXT,
    p_first_name TEXT,
    p_last_name TEXT,
    p_joining_year INT,
    p_serial INT
)
RETURNS TEXT AS $$
DECLARE
    v_alias TEXT;
    v_initials TEXT;
    v_year_str TEXT;
    v_serial_str TEXT;
BEGIN
    v_alias := UPPER(COALESCE(NULLIF(p_company_alias, ''), 'COMP'));
    v_initials := UPPER(
        COALESCE(SUBSTRING(p_first_name FROM 1 FOR 1), '') ||
        COALESCE(SUBSTRING(p_last_name FROM 1 FOR 1), 'X')
    );
    v_year_str := p_joining_year::TEXT;
    v_serial_str := LPAD(p_serial::TEXT, 4, '0');

    RETURN v_alias || v_initials || '01' || v_year_str || v_serial_str;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_employee_before_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_alias TEXT;
    v_first TEXT;
    v_last TEXT;
    v_names TEXT[];
BEGIN
    IF NEW.joining_year IS NULL THEN
        NEW.joining_year := EXTRACT(YEAR FROM CURRENT_DATE);
    END IF;

    IF NEW.joining_serial IS NULL OR NEW.joining_serial = 1 THEN
        NEW.joining_serial := next_joining_serial(NEW.company_id, NEW.joining_year);
    END IF;

    SELECT alias INTO v_alias FROM companies WHERE id = NEW.company_id;
    IF v_alias IS NULL THEN
        v_alias := 'COMP';
    END IF;

    v_names := regexp_split_to_array(TRIM(NEW.full_name), '\s+');
    v_first := v_names[1];
    IF array_length(v_names, 1) > 1 THEN
        v_last := v_names[array_length(v_names, 1)];
    ELSE
        v_last := 'X';
    END IF;

    IF NEW.login_id IS NULL OR NEW.login_id = '' THEN
        NEW.login_id := generate_login_id(v_alias, v_first, v_last, NEW.joining_year, NEW.joining_serial);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_employee_login_id ON employees;
CREATE TRIGGER set_employee_login_id
BEFORE INSERT ON employees
FOR EACH ROW
EXECUTE FUNCTION trg_employee_before_insert();

-- RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_private_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
