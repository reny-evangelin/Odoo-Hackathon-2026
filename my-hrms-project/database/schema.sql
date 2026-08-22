-- =====================================================================
-- HRMS (Human Resource Management System) — Supabase PostgreSQL Schema
-- =====================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------

create type employee_role as enum ('admin', 'hr', 'employee');
create type employee_status as enum ('active', 'inactive', 'terminated');
create type attendance_status as enum ('present', 'absent', 'on_leave', 'holiday', 'weekend');
create type time_off_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type marital_status as enum ('single', 'married', 'divorced', 'widowed');
create type gender_type as enum ('male', 'female', 'other', 'prefer_not_to_say');
create type salary_component_kind as enum ('earning', 'deduction');
create type payroll_status as enum ('draft', 'processed', 'paid');

-- ---------------------------------------------------------------------
-- FUNCTION: auto-update `updated_at`
-- ---------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- 1. COMPANIES  (tenants)
-- =====================================================================

create table if not exists companies (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  logo_url            text,
  company_code        text not null unique,      -- e.g. "02" used inside login_id
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

drop trigger if exists trg_companies_updated_at on companies;
create trigger trg_companies_updated_at
  before update on companies
  for each row execute function set_updated_at();

-- =====================================================================
-- 2. EMPLOYEES  (linked to auth.users)
-- =====================================================================

create table if not exists employees (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references companies(id) on delete cascade,
  user_id             uuid unique references auth.users(id) on delete set null,

  login_id            text not null unique,       -- system-generated
  first_name          text not null,
  last_name           text not null,
  email               text not null,
  phone               text,
  avatar_url          text,

  role                employee_role not null default 'employee',
  department          text,
  designation         text,
  manager_id          uuid references employees(id) on delete set null,

  date_of_joining     date not null,
  serial_of_joining   int not null,                -- serial number used to build login_id
  status              employee_status not null default 'active',

  must_reset_password boolean not null default true, -- system-generated password on first login

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  unique (company_id, email),
  unique (company_id, date_of_joining, serial_of_joining)
);

create index if not exists idx_employees_company on employees(company_id);
create index if not exists idx_employees_manager on employees(manager_id);

drop trigger if exists trg_employees_updated_at on employees;
create trigger trg_employees_updated_at
  before update on employees
  for each row execute function set_updated_at();

-- Helper: generate the next serial number for a given company + year
create or replace function next_joining_serial(p_company_id uuid, p_year int)
returns int as $$
declare
  v_next int;
begin
  select coalesce(max(serial_of_joining), 0) + 1
  into v_next
  from employees
  where company_id = p_company_id
    and extract(year from date_of_joining) = p_year;

  return v_next;
end;
$$ language plpgsql;

-- Helper: build login_id string
create or replace function generate_login_id(
  p_company_code text,
  p_first_name   text,
  p_last_name    text,
  p_year         int,
  p_serial       int
) returns text as $$
begin
  return upper(
    p_company_code
    || left(p_first_name, 2)
    || left(p_last_name, 2)
    || p_year::text
    || lpad(p_serial::text, 4, '0')
  );
end;
$$ language plpgsql immutable;

-- =====================================================================
-- 3. EMPLOYEE PRIVATE INFO
-- =====================================================================

create table if not exists employee_private_info (
  employee_id           uuid primary key references employees(id) on delete cascade,
  date_of_birth          date,
  gender                  gender_type,
  marital_status          marital_status,
  nationality             text,
  personal_email          text,
  present_address         text,
  permanent_address       text,
  zip_code                text,
  bank_account_number     text,
  bank_ifsc               text,
  pan_number              text,
  aadhar_number           text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  updated_at              timestamptz not null default now()
);

drop trigger if exists trg_private_info_updated_at on employee_private_info;
create trigger trg_private_info_updated_at
  before update on employee_private_info
  for each row execute function set_updated_at();

-- =====================================================================
-- 4. EMPLOYEE RESUME, SKILLS, CERTIFICATIONS
-- =====================================================================

create table if not exists employee_resume (
  employee_id       uuid primary key references employees(id) on delete cascade,
  about             text,
  what_i_love       text,
  interests_hobbies text,
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_resume_updated_at on employee_resume;
create trigger trg_resume_updated_at
  before update on employee_resume
  for each row execute function set_updated_at();

create table if not exists employee_skills (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid not null references employees(id) on delete cascade,
  skill        text not null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_skills_employee on employee_skills(employee_id);

create table if not exists employee_certifications (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references employees(id) on delete cascade,
  name            text not null,
  issuer          text,
  issue_date      date,
  expiry_date     date,
  attachment_url  text,
  created_at      timestamptz not null default now()
);

create index if not exists idx_certifications_employee on employee_certifications(employee_id);

-- =====================================================================
-- 5. SALARY INFO & COMPONENTS
-- =====================================================================

create table if not exists salary_info (
  employee_id         uuid primary key references employees(id) on delete cascade,
  wage_type           text not null default 'monthly',
  monthly_wage        numeric(12,2) not null default 0,
  yearly_wage         numeric(12,2) not null default 0,
  working_days_pct    numeric(5,2) not null default 100,
  basic_time_hours    numeric(5,2),
  pf_rate_pct         numeric(5,2) not null default 12,
  professional_tax    numeric(10,2) not null default 200,
  currency            text not null default 'INR',
  effective_from      date not null default current_date,
  updated_at          timestamptz not null default now()
);

drop trigger if exists trg_salary_info_updated_at on salary_info;
create trigger trg_salary_info_updated_at
  before update on salary_info
  for each row execute function set_updated_at();

create table if not exists salary_components (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references employees(id) on delete cascade,
  component_name text not null,
  kind           salary_component_kind not null default 'earning',
  percentage     numeric(5,2),
  amount         numeric(12,2) not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_salary_components_employee on salary_components(employee_id);

drop trigger if exists trg_salary_components_updated_at on salary_components;
create trigger trg_salary_components_updated_at
  before update on salary_components
  for each row execute function set_updated_at();

-- =====================================================================
-- 6. ATTENDANCE SCHEDULES & RECORDS
-- =====================================================================

create table if not exists attendance_schedules (
  id             uuid primary key default gen_random_uuid(),
  company_id     uuid not null references companies(id) on delete cascade,
  name           text not null,
  working_days   int[] not null default '{1,2,3,4,5}',
  shift_start    time not null default '09:00',
  shift_end      time not null default '18:00',
  created_at     timestamptz not null default now()
);

alter table employees
  add column if not exists attendance_schedule_id uuid references attendance_schedules(id);

create table if not exists attendance_records (
  id             uuid primary key default gen_random_uuid(),
  employee_id    uuid not null references employees(id) on delete cascade,
  company_id     uuid not null references companies(id) on delete cascade,
  work_date      date not null,
  check_in       timestamptz,
  check_out      timestamptz,
  work_hours     numeric(5,2) not null default 0,
  extra_hours    numeric(5,2) not null default 0,
  status         attendance_status not null default 'absent',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  unique (employee_id, work_date)
);

create index if not exists idx_attendance_employee_date on attendance_records(employee_id, work_date);
create index if not exists idx_attendance_company_date on attendance_records(company_id, work_date);

drop trigger if exists trg_attendance_updated_at on attendance_records;
create trigger trg_attendance_updated_at
  before update on attendance_records
  for each row execute function set_updated_at();

create table if not exists attendance_events (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references employees(id) on delete cascade,
  event_type    text not null check (event_type in ('check_in', 'check_out')),
  event_time    timestamptz not null default now(),
  source        text default 'systray'
);

create index if not exists idx_attendance_events_employee on attendance_events(employee_id, event_time);

-- =====================================================================
-- 7. TIME OFF (LEAVE) MANAGEMENT
-- =====================================================================

create table if not exists time_off_types (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references companies(id) on delete cascade,
  name                 text not null,
  is_paid              boolean not null default true,
  requires_attachment  boolean not null default false,
  created_at           timestamptz not null default now(),

  unique (company_id, name)
);

create table if not exists time_off_allocations (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid not null references employees(id) on delete cascade,
  time_off_type_id uuid not null references time_off_types(id) on delete cascade,
  allocated_days   numeric(5,2) not null default 0,
  used_days        numeric(5,2) not null default 0,
  validity_start   date not null,
  validity_end     date not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  unique (employee_id, time_off_type_id, validity_start, validity_end)
);

create index if not exists idx_toa_employee on time_off_allocations(employee_id);

drop trigger if exists trg_toa_updated_at on time_off_allocations;
create trigger trg_toa_updated_at
  before update on time_off_allocations
  for each row execute function set_updated_at();

create table if not exists time_off_requests (
  id                uuid primary key default gen_random_uuid(),
  employee_id       uuid not null references employees(id) on delete cascade,
  time_off_type_id  uuid not null references time_off_types(id),
  start_date        date not null,
  end_date          date not null,
  days              numeric(5,2) not null,
  reason            text,
  attachment_url    text,
  status            time_off_status not null default 'pending',
  reviewed_by       uuid references employees(id),
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  check (end_date >= start_date)
);

create index if not exists idx_tor_employee on time_off_requests(employee_id);
create index if not exists idx_tor_status on time_off_requests(status);

drop trigger if exists trg_tor_updated_at on time_off_requests;
create trigger trg_tor_updated_at
  before update on time_off_requests
  for each row execute function set_updated_at();

-- =====================================================================
-- 8. PAYROLL RUNS
-- =====================================================================

create table if not exists payroll_runs (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid not null references employees(id) on delete cascade,
  period_month     int not null check (period_month between 1 and 12),
  period_year      int not null,
  payable_days     numeric(5,2) not null default 0,
  gross_pay        numeric(12,2) not null default 0,
  total_deductions numeric(12,2) not null default 0,
  net_pay          numeric(12,2) not null default 0,
  status           payroll_status not null default 'draft',
  generated_at     timestamptz not null default now(),

  unique (employee_id, period_month, period_year)
);

create index if not exists idx_payroll_employee on payroll_runs(employee_id);

-- =====================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

alter table companies enable row level security;
alter table employees enable row level security;
alter table employee_private_info enable row level security;
alter table employee_resume enable row level security;
alter table employee_skills enable row level security;
alter table employee_certifications enable row level security;
alter table salary_info enable row level security;
alter table salary_components enable row level security;
alter table attendance_schedules enable row level security;
alter table attendance_records enable row level security;
alter table attendance_events enable row level security;
alter table time_off_types enable row level security;
alter table time_off_allocations enable row level security;
alter table time_off_requests enable row level security;
alter table payroll_runs enable row level security;

create or replace function my_employee()
returns table (id uuid, company_id uuid, role employee_role)
language sql
security definer
set search_path = public
stable
as $$
  select id, company_id, role from employees where user_id = auth.uid();
$$;

-- RLS Policies
drop policy if exists "employees_select_same_company" on employees;
create policy "employees_select_same_company"
  on employees for select
  using (company_id in (select company_id from my_employee()));

drop policy if exists "employees_write_admin_hr" on employees;
create policy "employees_write_admin_hr"
  on employees for all
  using (
    company_id in (
      select company_id from my_employee() where role in ('admin', 'hr')
    )
  );

drop policy if exists "private_info_owner_or_admin" on employee_private_info;
create policy "private_info_owner_or_admin"
  on employee_private_info for all
  using (
    employee_id = (select id from my_employee())
    or employee_id in (
      select e.id from employees e
      join my_employee() me on me.company_id = e.company_id
      where me.role in ('admin', 'hr')
    )
  );

drop policy if exists "salary_info_admin_only" on salary_info;
create policy "salary_info_admin_only"
  on salary_info for all
  using (
    employee_id in (
      select e.id from employees e
      join my_employee() me on me.company_id = e.company_id
      where me.role = 'admin'
    )
  );

drop policy if exists "salary_components_admin_only" on salary_components;
create policy "salary_components_admin_only"
  on salary_components for all
  using (
    employee_id in (
      select e.id from employees e
      join my_employee() me on me.company_id = e.company_id
      where me.role = 'admin'
    )
  );

drop policy if exists "attendance_owner_or_admin" on attendance_records;
create policy "attendance_owner_or_admin"
  on attendance_records for select
  using (
    employee_id = (select id from my_employee())
    or company_id in (select company_id from my_employee() where role in ('admin', 'hr'))
  );

drop policy if exists "attendance_owner_insert" on attendance_records;
create policy "attendance_owner_insert"
  on attendance_records for insert
  with check (employee_id = (select id from my_employee()));

drop policy if exists "attendance_owner_update" on attendance_records;
create policy "attendance_owner_update"
  on attendance_records for update
  using (
    employee_id = (select id from my_employee())
    or company_id in (select company_id from my_employee() where role in ('admin', 'hr'))
  );

drop policy if exists "timeoff_owner_or_admin_select" on time_off_requests;
create policy "timeoff_owner_or_admin_select"
  on time_off_requests for select
  using (
    employee_id = (select id from my_employee())
    or employee_id in (
      select e.id from employees e
      join my_employee() me on me.company_id = e.company_id
      where me.role in ('admin', 'hr')
    )
  );

drop policy if exists "timeoff_owner_insert" on time_off_requests;
create policy "timeoff_owner_insert"
  on time_off_requests for insert
  with check (employee_id = (select id from my_employee()));

drop policy if exists "timeoff_admin_update" on time_off_requests;
create policy "timeoff_admin_update"
  on time_off_requests for update
  using (
    employee_id = (
      select e.id from employees e
      join my_employee() me on me.company_id = e.company_id
      where me.role in ('admin', 'hr')
    )
  );
