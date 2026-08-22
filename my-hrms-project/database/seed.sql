-- Seed data script for HRMS testing

-- Create test company
INSERT INTO companies (id, name, alias)
VALUES ('00000000-0000-0000-0000-000000000001', 'Odoo Ecosystems', 'OE')
ON CONFLICT (id) DO NOTHING;

-- Default Attendance Schedule
INSERT INTO attendance_schedules (id, company_id, name, work_start_time, work_end_time, working_days_per_week)
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Standard Working Hours', '09:00:00', '17:00:00', 5)
ON CONFLICT (id) DO NOTHING;

-- Default Time Off Types
INSERT INTO time_off_types (id, company_id, name, requires_attachment, max_days_per_year)
VALUES 
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Paid Time Off', false, 24),
('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Sick Leave', true, 7),
('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'Unpaid Leaves', false, 30)
ON CONFLICT (id) DO NOTHING;
