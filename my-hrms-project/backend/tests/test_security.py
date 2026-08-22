import sys
import os
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

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
