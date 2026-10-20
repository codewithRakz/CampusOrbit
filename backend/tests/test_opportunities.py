from fastapi.testclient import TestClient
from datetime import datetime, timedelta, timezone
import pytest

from main import app

client = TestClient(app)

def get_auth_token(email: str, role: str = "student", name: str = "Test User") -> str:
    client.post(
        "/api/auth/register",
        json={
            "full_name": name,
            "email": email,
            "password": "securepassword123",
            "role": role
        }
    )
    res = client.post(
        "/api/auth/login",
        data={"username": email, "password": "securepassword123"}
    )
    return res.json()["access_token"]

def test_unauthenticated_requests_rejected():
    res = client.get("/api/opportunities")
    assert res.status_code == 401

    res = client.post("/api/opportunities", json={"title": "Test Intern"})
    assert res.status_code == 401

    res = client.post("/api/applications/1")
    assert res.status_code == 401

    res = client.get("/api/applications/me")
    assert res.status_code == 401

def test_student_forbidden_from_creating_opportunity():
    student_token = get_auth_token("stud_opp@campusorbit.com", role="student")
    headers = {"Authorization": f"Bearer {student_token}"}

    res = client.post(
        "/api/opportunities",
        json={
            "title": "Software Intern",
            "company_name": "Google",
            "location": "Bangalore",
            "opportunity_type": "internship",
            "description": "Develop scalable web services and cloud pipelines"
        },
        headers=headers
    )
    assert res.status_code == 403
    assert res.json()["detail"] == "Operation not permitted for your role"

def test_placement_officer_crud_opportunity():
    officer_token = get_auth_token("officer_crud@campusorbit.com", role="placement_officer")
    headers = {"Authorization": f"Bearer {officer_token}"}

    # 1. Create opportunity
    create_res = client.post(
        "/api/opportunities",
        json={
            "title": "Frontend Engineer Intern",
            "company_name": "Acme Corp",
            "location": "Remote",
            "opportunity_type": "internship",
            "description": "Build high performance React web apps",
            "stipend": "₹25,000/month",
            "min_cgpa": 7.5
        },
        headers=headers
    )
    assert create_res.status_code == 201
    opp_data = create_res.json()
    assert opp_data["title"] == "Frontend Engineer Intern"
    assert opp_data["is_active"] is True
    opp_id = opp_data["id"]

    # 2. Retrieve detail
    get_res = client.get(f"/api/opportunities/{opp_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["company_name"] == "Acme Corp"

    # 3. Update opportunity
    update_res = client.put(
        f"/api/opportunities/{opp_id}",
        json={"location": "Hybrid - Bangalore", "min_cgpa": 8.0},
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["location"] == "Hybrid - Bangalore"
    assert update_res.json()["min_cgpa"] == 8.0

    # 4. Deactivate opportunity (soft delete)
    del_res = client.delete(f"/api/opportunities/{opp_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["message"] == "Opportunity deactivated successfully"

    # Check that opportunity is now inactive
    get_after = client.get(f"/api/opportunities/{opp_id}", headers=headers)
    assert get_after.json()["is_active"] is False

def test_opportunity_search_and_filtering():
    officer_token = get_auth_token("officer_filter@campusorbit.com", role="placement_officer")
    headers_officer = {"Authorization": f"Bearer {officer_token}"}

    # Create 3 distinct opportunities
    client.post(
        "/api/opportunities",
        json={
            "title": "Data Scientist Intern",
            "company_name": "DeepMind Lab",
            "location": "Bangalore",
            "opportunity_type": "research",
            "description": "Machine learning and deep learning pipelines",
            "min_cgpa": 8.5
        },
        headers=headers_officer
    )
    client.post(
        "/api/opportunities",
        json={
            "title": "Backend Go Developer",
            "company_name": "Cloud Infra Inc",
            "location": "Remote",
            "opportunity_type": "internship",
            "description": "Golang microservices and Kubernetes",
            "min_cgpa": 7.0
        },
        headers=headers_officer
    )

    student_token = get_auth_token("stud_filter@campusorbit.com", role="student")
    headers_student = {"Authorization": f"Bearer {student_token}"}

    # Search keyword
    res = client.get("/api/opportunities?keyword=Machine", headers=headers_student)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["company_name"] == "DeepMind Lab"

    # Filter by location
    res = client.get("/api/opportunities?location=Remote", headers=headers_student)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["title"] == "Backend Go Developer"

    # Filter by opportunity_type
    res = client.get("/api/opportunities?opportunity_type=research", headers=headers_student)
    assert res.status_code == 200
    assert len(res.json()) == 1

    # Filter by max_min_cgpa: student with CGPA 7.5 can view jobs requiring <= 7.5
    res = client.get("/api/opportunities?max_min_cgpa=7.5", headers=headers_student)
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["title"] == "Backend Go Developer"

def test_student_application_workflow():
    officer_token = get_auth_token("officer_app@campusorbit.com", role="placement_officer")
    headers_officer = {"Authorization": f"Bearer {officer_token}"}

    # Create opportunity
    opp = client.post(
        "/api/opportunities",
        json={
            "title": "Full Stack Intern",
            "company_name": "Innovate Corp",
            "location": "Remote",
            "opportunity_type": "internship",
            "description": "React and FastAPI full stack developer"
        },
        headers=headers_officer
    ).json()

    student_token = get_auth_token("stud_app@campusorbit.com", role="student", name="Applicant One")
    headers_student = {"Authorization": f"Bearer {student_token}"}

    # 1. Apply to active opportunity
    apply_res = client.post(
        f"/api/applications/{opp['id']}",
        json={"notes": "Highly interested in this opportunity!"},
        headers=headers_student
    )
    assert apply_res.status_code == 201
    app_data = apply_res.json()
    assert app_data["status"] == "applied"
    assert app_data["internship_id"] == opp["id"]
    application_id = app_data["id"]

    # 2. Duplicate application rejection
    dup_res = client.post(
        f"/api/applications/{opp['id']}",
        json={"notes": "Duplicate try"},
        headers=headers_student
    )
    assert dup_res.status_code == 400
    assert "already applied" in dup_res.json()["detail"]

    # 3. Retrieve student's own applications
    my_apps = client.get("/api/applications/me", headers=headers_student)
    assert my_apps.status_code == 200
    apps_list = my_apps.json()
    assert len(apps_list) == 1
    assert apps_list[0]["internship"]["title"] == "Full Stack Intern"
    assert apps_list[0]["status"] == "applied"

    # 4. Placement officer reviews applications
    opp_apps = client.get(f"/api/opportunities/{opp['id']}/applications", headers=headers_officer)
    assert opp_apps.status_code == 200
    assert len(opp_apps.json()) == 1
    assert opp_apps.json()[0]["student"]["email"] == "stud_app@campusorbit.com"

    # 5. Placement officer updates status
    status_res = client.patch(
        f"/api/applications/{application_id}/status",
        json={"status": "shortlisted"},
        headers=headers_officer
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "shortlisted"

    # 6. Student views updated status
    my_updated_apps = client.get("/api/applications/me", headers=headers_student)
    assert my_updated_apps.json()[0]["status"] == "shortlisted"

def test_students_forbidden_from_updating_application_status():
    officer_token = get_auth_token("officer_perm@campusorbit.com", role="placement_officer")
    student_token = get_auth_token("stud_perm@campusorbit.com", role="student")

    opp = client.post(
        "/api/opportunities",
        json={
            "title": "Security Analyst",
            "company_name": "Cyber Inc",
            "location": "Chennai",
            "opportunity_type": "placement",
            "description": "Threat analysis and penetration testing"
        },
        headers={"Authorization": f"Bearer {officer_token}"}
    ).json()

    app_data = client.post(
        f"/api/applications/{opp['id']}",
        json={},
        headers={"Authorization": f"Bearer {student_token}"}
    ).json()

    # Student attempts to change their own status to 'accepted' -> 403 Forbidden
    res = client.patch(
        f"/api/applications/{app_data['id']}/status",
        json={"status": "accepted"},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 403

def test_placement_officer_cannot_apply_as_student():
    officer_token = get_auth_token("officer_apply@campusorbit.com", role="placement_officer")
    opp = client.post(
        "/api/opportunities",
        json={
            "title": "Role Test",
            "company_name": "Company",
            "location": "City",
            "opportunity_type": "internship",
            "description": "Role testing description"
        },
        headers={"Authorization": f"Bearer {officer_token}"}
    ).json()

    res = client.post(
        f"/api/applications/{opp['id']}",
        json={},
        headers={"Authorization": f"Bearer {officer_token}"}
    )
    assert res.status_code == 403

def test_apply_to_inactive_or_expired_opportunity_rejected():
    officer_token = get_auth_token("officer_expired@campusorbit.com", role="placement_officer")
    student_token = get_auth_token("stud_expired@campusorbit.com", role="student")

    # Past deadline
    yesterday = datetime.now(timezone.utc) - timedelta(days=1)
    opp_expired = client.post(
        "/api/opportunities",
        json={
            "title": "Expired Opportunity",
            "company_name": "Past Corp",
            "location": "Remote",
            "opportunity_type": "internship",
            "description": "This opportunity has expired yesterday",
            "deadline": yesterday.isoformat()
        },
        headers={"Authorization": f"Bearer {officer_token}"}
    ).json()

    # Attempt to apply to expired
    res = client.post(
        f"/api/applications/{opp_expired['id']}",
        json={},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 400
    assert "deadline has passed" in res.json()["detail"]

    # Deactivated opportunity
    opp_deactivated = client.post(
        "/api/opportunities",
        json={
            "title": "Deactivated Opp",
            "company_name": "Inactive Corp",
            "location": "Remote",
            "opportunity_type": "internship",
            "description": "Deactivated opportunity description"
        },
        headers={"Authorization": f"Bearer {officer_token}"}
    ).json()

    # Deactivate it
    client.delete(f"/api/opportunities/{opp_deactivated['id']}", headers={"Authorization": f"Bearer {officer_token}"})

    # Attempt to apply to deactivated
    res = client.post(
        f"/api/applications/{opp_deactivated['id']}",
        json={},
        headers={"Authorization": f"Bearer {student_token}"}
    )
    assert res.status_code == 400
    assert "inactive" in res.json()["detail"]
