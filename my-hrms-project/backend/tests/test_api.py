import sys
import os
import pytest

# Ensure project root is in path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_token():
    """Create a test user and obtain an auth token (if applicable)."""
    # Assuming a registration endpoint exists at /api/auth/register
    reg_resp = client.post("/api/auth/signup", json={
        "email": "testuser@example.com",
        "password": "StrongPass123!",
        "full_name": "Test User"
    })
    assert reg_resp.status_code in [200, 201]
    login_resp = client.post("/api/auth/login", json={
    "identifier": "testuser@example.com",
    "password": "StrongPass123!"
})
    assert login_resp.status_code == 200
    return login_resp.json().get("access_token")

def test_auth_login_success(auth_token):
    assert auth_token is not None

def test_create_employee(auth_token):
    headers = {"Authorization": f"Bearer {auth_token}"}
    resp = client.post("/api/employees", json={
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "position": "Engineer"
    }, headers=headers)
    assert resp.status_code in [200, 201]
    data = resp.json()
    assert data["email"] == "john.doe@example.com"
    employee_id = data.get("id")
    # Cleanup: delete the employee
    del_resp = client.delete(f"/api/employees/{employee_id}", headers=headers)
    assert del_resp.status_code in [200, 204]

def test_get_employee_unauthenticated():
    # Should be unauthorized without token
    resp = client.get("/api/employees")
    assert resp.status_code == 401
