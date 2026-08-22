import sys
import os

try:
    import pytest
except ImportError:
    pytest = None

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app
from routes.auth import build_login_id, generate_temporary_password

client = TestClient(app)


def test_health_check():
    """Verify backend API health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["backend"] == "healthy"


def test_root_endpoint():
    """Verify API root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_salary_info_security():
    """Verify non-existent or invalid salary query handling."""
    response = client.get("/api/salary/00000000-0000-0000-0000-000000000000")
    assert response.status_code in [404, 401, 403]


def test_time_off_approval_security():
    """Verify invalid time-off review requests are handled cleanly."""
    response = client.patch(
        "/api/timeoff/requests/invalid-req-id",
        json={"status": "approved", "reviewed_by": "unknown"}
    )
    assert response.status_code in [400, 404, 401, 403]


def test_build_login_id_rule():
    lid1 = build_login_id("OI", "John Doe", 2023, 1)
    assert lid1 == "OIJOD20230001"

    lid2 = build_login_id("COMP", "Sarah Connor", 2026, 15)
    assert lid2 == "COMPSAC20260015"


def test_generate_temporary_password():
    pwd = generate_temporary_password(12)
    assert len(pwd) >= 12
    assert any(c.isupper() for c in pwd)
    assert any(c.islower() for c in pwd)
    assert any(c.isdigit() for c in pwd)
    assert any(c in "!@#$%^&*" for c in pwd)


def test_login_empty_credentials():
    response = client.post(
        "/api/auth/login",
        json={"identifier": "", "password": ""}
    )
    assert response.status_code == 400


def test_login_invalid_credentials():
    response = client.post(
        "/api/auth/login",
        json={
            "identifier": "NONEXISTENT_LOGIN_ID",
            "password": "WrongPassword123!"
        }
    )
    assert response.status_code == 401


def test_salary_info_role_isolation():
    fake_employee_token = "Bearer fake_employee_jwt_token"

    response = client.get(
        "/api/employees/emp-123/salary-info",
        headers={"Authorization": fake_employee_token}
    )

    assert response.status_code in [401, 403]


def test_time_off_approval_role_isolation():
    fake_employee_token = "Bearer fake_employee_jwt_token"

    response = client.post(
        "/api/time-off/approve-reject",
        json={
            "request_id": "req-123",
            "status": "approved"
        },
        headers={"Authorization": fake_employee_token}
    )

    assert response.status_code in [401, 403]


def test_unauthorized_access():
    response = client.get("/api/employees")
    assert response.status_code == 401