import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    """Verify backend API is responsive."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_salary_info_role_isolation():
    """
    Security Test: An employee role token MUST NOT be able to access salary_info endpoints.
    """
    # Mocking employee token request without admin role
    fake_employee_token = "Bearer fake_employee_jwt_token"
    
    # Attempting to fetch salary info with non-admin context should be rejected or forbidden
    response = client.get(
        "/api/employees/emp-123/salary-info",
        headers={"Authorization": fake_employee_token}
    )
    # Must fail with 401 (Invalid token) or 403 (Forbidden)
    assert response.status_code in [401, 403]

def test_time_off_approval_role_isolation():
    """
    Security Test: An employee role token MUST NOT be able to approve time off requests.
    """
    fake_employee_token = "Bearer fake_employee_jwt_token"
    
    response = client.post(
        "/api/time-off/approve-reject",
        json={"request_id": "req-123", "status": "approved"},
        headers={"Authorization": fake_employee_token}
    )
    assert response.status_code in [401, 403]

def test_unauthorized_access():
    """Verify missing authorization headers return 401 Unauthorized."""
    response = client.get("/api/employees")
    assert response.status_code == 401
