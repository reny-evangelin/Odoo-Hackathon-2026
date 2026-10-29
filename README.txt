Odoo Hackathon 2026
===================

Project Overview
----------------
This repository contains the codebase for the Odoo Hackathon 2026 project. The main application is a multi-tenant Human Resource Management System (HRMS) built with Supabase, PostgreSQL, and FastAPI. It is designed to manage employee records, attendance, leave requests, payroll, and role-based access for admin, HR, and employee users.

Repository Structure
--------------------
- my-hrms-project/
  - backend/                  - FastAPI backend service and API routes
  - database/                 - SQL schemas, seed data, and database project files
  - supabase/                 - Supabase migration files
  - frontend/                 - Frontend application files
  - .env.example              - Sample environment configuration
  - docker-compose.yml        - Local container orchestration
  - requirements.txt          - Python dependency list
  - render.yaml               - Deployment configuration for Render

Core Features
-------------
- Multi-tenancy with company-based isolation
- Row Level Security (RLS) for different user roles
- Employee profile and HR management
- Attendance tracking and check-in/check-out records
- Leave and time-off management with approvals
- Payroll computation and deduction logic
- Authentication, onboarding, and password reset support

Getting Started
---------------
1. Navigate to the my-hrms-project folder.
2. Copy .env.example to .env and update the Supabase and app settings.
3. Apply the SQL schema migration from the database or supabase folder.
4. Install the required Python dependencies:
   pip install -r requirements.txt
5. Start the backend service:
   uvicorn backend.main:app --host 0.0.0.0 --port 5000 --reload

Access Points
-------------
- API docs: http://localhost:5000/docs
- Supabase database and auth configuration through the configured project URL and keys

Project Status
--------------
This project is a hackathon-ready HRMS backend with database, API logic, and deployment configuration, suitable for demo or further enhancement.

For more details, see the project README inside the my-hrms-project folder.
