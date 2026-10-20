from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def get_auth_token(email: str, role: str = "student", name: str = "Test User") -> str:
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "full_name": name,
            "email": email,
            "password": "securepassword123",
            "role": role
        }
    )
    # Login user
    res = client.post(
        "/api/auth/login",
        data={"username": email, "password": "securepassword123"}
    )
    return res.json()["access_token"]

def test_unauthenticated_requests_rejected():
    res = client.get("/api/profile/me")
    assert res.status_code == 401

    res = client.put("/api/profile/me", json={"department": "CSE"})
    assert res.status_code == 401

    res = client.post("/api/profile/skills", json={"name": "Python", "category": "Backend"})
    assert res.status_code == 401

    res = client.post("/api/profile/projects", json={"title": "Test Project"})
    assert res.status_code == 401

def test_non_student_role_forbidden():
    faculty_token = get_auth_token("prof@campusorbit.com", role="faculty", name="Prof Smith")
    headers = {"Authorization": f"Bearer {faculty_token}"}

    res = client.get("/api/profile/me", headers=headers)
    assert res.status_code == 403
    assert res.json()["detail"] == "Operation not permitted for your role"

    res = client.put("/api/profile/me", json={"department": "CSE"}, headers=headers)
    assert res.status_code == 403

    res = client.post("/api/profile/skills", json={"name": "Python", "category": "Backend"}, headers=headers)
    assert res.status_code == 403

def test_create_and_retrieve_profile():
    token = get_auth_token("alex@campusorbit.com", role="student", name="Alex Student")
    headers = {"Authorization": f"Bearer {token}"}

    # Profile not yet created -> 404
    res = client.get("/api/profile/me", headers=headers)
    assert res.status_code == 404

    # Create profile
    res = client.put(
        "/api/profile/me",
        json={
            "department": "Computer Science & Engineering",
            "year_of_study": 3,
            "cgpa": 8.85,
            "bio": "Aspiring Systems Engineer",
            "github_url": "https://github.com/alex",
            "linkedin_url": "https://linkedin.com/in/alex"
        },
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["department"] == "Computer Science & Engineering"
    assert data["year_of_study"] == 3
    assert data["cgpa"] == 8.85
    assert data["bio"] == "Aspiring Systems Engineer"
    assert "id" in data
    assert "user_id" in data

    # Retrieve profile
    get_res = client.get("/api/profile/me", headers=headers)
    assert get_res.status_code == 200
    get_data = get_res.json()
    assert get_data["department"] == "Computer Science & Engineering"
    assert get_data["cgpa"] == 8.85

def test_update_existing_profile():
    token = get_auth_token("sara@campusorbit.com", role="student", name="Sara Lee")
    headers = {"Authorization": f"Bearer {token}"}

    # Initial creation
    client.put("/api/profile/me", json={"department": "ECE", "cgpa": 7.5}, headers=headers)

    # Update CGPA and department
    res = client.put("/api/profile/me", json={"department": "CSE", "cgpa": 9.1}, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["department"] == "CSE"
    assert data["cgpa"] == 9.1

def test_invalid_cgpa_and_year_bounds():
    token = get_auth_token("bounds@campusorbit.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}

    # CGPA > 10.0
    res = client.put("/api/profile/me", json={"cgpa": 11.5}, headers=headers)
    assert res.status_code == 422

    # CGPA < 0.0
    res = client.put("/api/profile/me", json={"cgpa": -1.0}, headers=headers)
    assert res.status_code == 422

    # Year of study > 5
    res = client.put("/api/profile/me", json={"year_of_study": 6}, headers=headers)
    assert res.status_code == 422

    # Year of study < 1
    res = client.put("/api/profile/me", json={"year_of_study": 0}, headers=headers)
    assert res.status_code == 422

def test_skills_management_and_duplicate_prevention():
    token = get_auth_token("skill_user@campusorbit.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}

    # Add skill
    res = client.post(
        "/api/profile/skills",
        json={"name": "FastAPI", "category": "Backend", "proficiency_level": "intermediate"},
        headers=headers
    )
    assert res.status_code == 201
    skill_data = res.json()
    assert skill_data["skill"]["name"] == "FastAPI"
    assert skill_data["proficiency_level"] == "intermediate"
    student_skill_id = skill_data["id"]

    # Verify skill appears in profile
    profile_res = client.get("/api/profile/me", headers=headers)
    assert profile_res.status_code == 200
    assert len(profile_res.json()["skills"]) == 1

    # Attempt to add duplicate skill -> 400 Bad Request
    dup_res = client.post(
        "/api/profile/skills",
        json={"name": "fastapi", "category": "Backend", "proficiency_level": "advanced"},
        headers=headers
    )
    assert dup_res.status_code == 400
    assert "already added to your profile" in dup_res.json()["detail"]

    # Remove skill
    del_res = client.delete(f"/api/profile/skills/{student_skill_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify skill removed from profile
    profile_after = client.get("/api/profile/me", headers=headers)
    assert len(profile_after.json()["skills"]) == 0

def test_projects_creation_and_deletion():
    token = get_auth_token("project_user@campusorbit.com", role="student")
    headers = {"Authorization": f"Bearer {token}"}

    # Add project
    res = client.post(
        "/api/profile/projects",
        json={
            "title": "Campus Orbit Portal",
            "description": "Full stack campus career platform",
            "tech_stack": "FastAPI, React, PostgreSQL",
            "repo_url": "https://github.com/test/orbit",
            "live_url": "https://orbit.campus.edu"
        },
        headers=headers
    )
    assert res.status_code == 201
    proj_data = res.json()
    assert proj_data["title"] == "Campus Orbit Portal"
    project_id = proj_data["id"]

    # Verify project in profile
    profile_res = client.get("/api/profile/me", headers=headers)
    assert len(profile_res.json()["projects"]) == 1
    assert profile_res.json()["projects"][0]["title"] == "Campus Orbit Portal"

    # Delete project
    del_res = client.delete(f"/api/profile/projects/{project_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify project removed
    profile_after = client.get("/api/profile/me", headers=headers)
    assert len(profile_after.json()["projects"]) == 0

def test_cross_student_isolation():
    # Student A
    token_a = get_auth_token("student_a@campusorbit.com", role="student", name="Student A")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Student B
    token_b = get_auth_token("student_b@campusorbit.com", role="student", name="Student B")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Student A adds project and skill
    proj_a = client.post(
        "/api/profile/projects",
        json={"title": "Student A Project"},
        headers=headers_a
    ).json()

    skill_a = client.post(
        "/api/profile/skills",
        json={"name": "Docker", "category": "DevOps"},
        headers=headers_a
    ).json()

    # Student B attempts to delete Student A's project -> 404
    res = client.delete(f"/api/profile/projects/{proj_a['id']}", headers=headers_b)
    assert res.status_code == 404

    # Student B attempts to delete Student A's skill -> 404
    res = client.delete(f"/api/profile/skills/{skill_a['id']}", headers=headers_b)
    assert res.status_code == 404

    # Verify Student A still has project and skill
    profile_a = client.get("/api/profile/me", headers=headers_a).json()
    assert len(profile_a["projects"]) == 1
    assert len(profile_a["skills"]) == 1
