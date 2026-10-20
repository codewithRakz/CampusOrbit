from fastapi.testclient import TestClient
import pytest
from datetime import timedelta
from fastapi import Depends

from main import app
import models, security

# Add a test-only role-restricted endpoint to verify require_roles dependency
@app.get("/api/test/placement-only")
def placement_only_route(
    current_user: models.User = Depends(
        security.require_roles(models.UserRole.placement_officer)
    )
):
    return {"message": "Welcome Placement Officer", "user": current_user.email}

client = TestClient(app)

def test_successful_registration():
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Student",
            "email": "student@campusorbit.com",
            "password": "securepassword123",
            "role": "student"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "student@campusorbit.com"
    assert data["role"] == "student"
    assert "id" in data
    assert "hashed_password" not in data

def test_duplicate_email_registration():
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Student 1",
            "email": "duplicate@campusorbit.com",
            "password": "securepassword123"
        }
    )
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Student 2",
            "email": "duplicate@campusorbit.com",
            "password": "anotherpassword123"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_prevent_admin_registration():
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Hacker",
            "email": "admin@campusorbit.com",
            "password": "securepassword123",
            "role": "admin"
        }
    )
    assert response.status_code == 422
    assert "Admin accounts cannot be created" in response.text

def test_successful_login():
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Login Tester",
            "email": "login@campusorbit.com",
            "password": "loginpassword123",
            "role": "faculty"
        }
    )
    response = client.post(
        "/api/auth/login",
        data={
            "username": "login@campusorbit.com",
            "password": "loginpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_invalid_login():
    response = client.post(
        "/api/auth/login",
        data={
            "username": "nonexistent@campusorbit.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_get_me_successful():
    # Register and login a student
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Me Tester",
            "email": "me@campusorbit.com",
            "password": "securepassword123",
            "role": "student"
        }
    )
    login_res = client.post(
        "/api/auth/login",
        data={
            "username": "me@campusorbit.com",
            "password": "securepassword123"
        }
    )
    token = login_res.json()["access_token"]

    # Call GET /api/auth/me
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "me@campusorbit.com"
    assert data["full_name"] == "Me Tester"
    assert data["role"] == "student"
    assert "id" in data
    assert "created_at" in data
    assert "hashed_password" not in data

def test_get_me_missing_token():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_get_me_invalid_token():
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid.malformed.token"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

def test_get_me_expired_token():
    # Register a user
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Expired Tester",
            "email": "expired@campusorbit.com",
            "password": "securepassword123",
            "role": "student"
        }
    )
    # Generate an expired token
    expired_token = security.create_access_token(
        data={"sub": "expired@campusorbit.com", "role": "student"},
        expires_delta=timedelta(seconds=-10)
    )

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Token has expired"

def test_require_roles_enforcement():
    # 1. Register a Student
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Student Role",
            "email": "student_role@campusorbit.com",
            "password": "securepassword123",
            "role": "student"
        }
    )
    student_login = client.post(
        "/api/auth/login",
        data={
            "username": "student_role@campusorbit.com",
            "password": "securepassword123"
        }
    )
    student_token = student_login.json()["access_token"]

    # Student accessing placement-only route -> 403 Forbidden
    unauthorized_res = client.get(
        "/api/test/placement-only",
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert unauthorized_res.status_code == 403
    assert unauthorized_res.json()["detail"] == "Operation not permitted for your role"

    # 2. Register a Placement Officer
    client.post(
        "/api/auth/register",
        json={
            "full_name": "Placement Officer",
            "email": "placement_role@campusorbit.com",
            "password": "securepassword123",
            "role": "placement_officer"
        }
    )
    placement_login = client.post(
        "/api/auth/login",
        data={
            "username": "placement_role@campusorbit.com",
            "password": "securepassword123"
        }
    )
    placement_token = placement_login.json()["access_token"]

    # Placement officer accessing placement-only route -> 200 OK
    authorized_res = client.get(
        "/api/test/placement-only",
        headers={"Authorization": f"Bearer {placement_token}"}
    )
    assert authorized_res.status_code == 200
    assert authorized_res.json()["user"] == "placement_role@campusorbit.com"
