import uuid
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def get_auth_token(email: str, role: str = "faculty", name: str = "Test Faculty") -> str:
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
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]

def test_unauthenticated_faculty_endpoints():
    assert client.get("/api/faculty/advisees").status_code == 401
    assert client.post("/api/faculty/advisees", json={"student_email": "stu@test.com"}).status_code == 401
    assert client.get("/api/faculty/advisees/999").status_code == 401
    assert client.put("/api/faculty/advisees/999/feedback", json={"notes": "test"}).status_code == 401
    assert client.delete("/api/faculty/advisees/999").status_code == 401

def test_non_faculty_role_forbidden():
    u = uuid.uuid4().hex[:6]
    student_token = get_auth_token(f"stu_{u}@campusorbit.edu", role="student", name="Student One")
    stu_headers = {"Authorization": f"Bearer {student_token}"}
    
    assert client.get("/api/faculty/advisees", headers=stu_headers).status_code == 403
    assert client.post("/api/faculty/advisees", json={"student_email": "x@y.com"}, headers=stu_headers).status_code == 403

    po_token = get_auth_token(f"po_{u}@campusorbit.edu", role="placement_officer", name="Placement Officer")
    po_headers = {"Authorization": f"Bearer {po_token}"}
    assert client.get("/api/faculty/advisees", headers=po_headers).status_code == 403

def test_assign_advisee_validation_and_duplicate():
    u = uuid.uuid4().hex[:6]
    faculty_token = get_auth_token(f"prof_{u}@campusorbit.edu", role="faculty", name="Prof Turing")
    fac_headers = {"Authorization": f"Bearer {faculty_token}"}

    # 1. Non-existent email -> 404
    res = client.post("/api/faculty/advisees", json={"student_email": f"nonexistent_{u}@campusorbit.edu"}, headers=fac_headers)
    assert res.status_code == 404

    # 2. Assign non-student (another faculty) -> 400
    peer_faculty_email = f"peer_{u}@campusorbit.edu"
    get_auth_token(peer_faculty_email, role="faculty", name="Prof Lovelace")
    res = client.post("/api/faculty/advisees", json={"student_email": peer_faculty_email}, headers=fac_headers)
    assert res.status_code == 400
    assert "not a student" in res.json()["detail"].lower()

    # 3. Valid student assignment -> 201
    student_email = f"candidate_{u}@campusorbit.edu"
    get_auth_token(student_email, role="student", name="Candidate Alice")
    res = client.post(
        "/api/faculty/advisees",
        json={"student_email": student_email, "notes": "Initial academic onboarding"},
        headers=fac_headers
    )
    assert res.status_code == 201
    data = res.json()
    assert data["student"]["email"] == student_email
    assert data["notes"] == "Initial academic onboarding"
    assert data["is_student_visible"] is False  # Private by default

    # 4. Duplicate assignment to same faculty -> 400
    dup_res = client.post(
        "/api/faculty/advisees",
        json={"student_email": student_email},
        headers=fac_headers
    )
    assert dup_res.status_code == 400
    assert "already in your advisee cohort" in dup_res.json()["detail"].lower()

def test_faculty_ownership_isolation():
    u = uuid.uuid4().hex[:6]
    # Faculty A and Student A
    fac_a_token = get_auth_token(f"prof_a_{u}@campusorbit.edu", role="faculty", name="Prof A")
    fac_a_headers = {"Authorization": f"Bearer {fac_a_token}"}
    stu_a_email = f"stu_a_{u}@campusorbit.edu"
    get_auth_token(stu_a_email, role="student", name="Student A")

    assign_res = client.post(
        "/api/faculty/advisees",
        json={"student_email": stu_a_email, "notes": "Private note for Student A"},
        headers=fac_a_headers
    )
    assert assign_res.status_code == 201
    stu_a_id = assign_res.json()["student_id"]

    # Faculty B
    fac_b_token = get_auth_token(f"prof_b_{u}@campusorbit.edu", role="faculty", name="Prof B")
    fac_b_headers = {"Authorization": f"Bearer {fac_b_token}"}

    # Faculty B should NOT see Student A in advisees list
    b_list = client.get("/api/faculty/advisees", headers=fac_b_headers).json()
    assert not any(a["student_id"] == stu_a_id for a in b_list)

    # Faculty B cannot view Student A portfolio -> 404
    b_view = client.get(f"/api/faculty/advisees/{stu_a_id}", headers=fac_b_headers)
    assert b_view.status_code == 404
    assert "not assigned to you" in b_view.json()["detail"].lower()

    # Faculty B cannot update feedback for Student A -> 404
    b_update = client.put(
        f"/api/faculty/advisees/{stu_a_id}/feedback",
        json={"notes": "Hacked feedback", "is_student_visible": True},
        headers=fac_b_headers
    )
    assert b_update.status_code == 404

    # Faculty B cannot unassign Student A -> 404
    b_del = client.delete(f"/api/faculty/advisees/{stu_a_id}", headers=fac_b_headers)
    assert b_del.status_code == 404

def test_advisee_portfolio_inspection_and_privacy():
    u = uuid.uuid4().hex[:6]
    fac_token = get_auth_token(f"mentor_{u}@campusorbit.edu", role="faculty", name="Prof Mentor")
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    stu_token = get_auth_token(f"dev_student_{u}@campusorbit.edu", role="student", name="Dev Student")
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    # Student creates profile, skills, projects
    client.put("/api/profile/me", json={
        "department": "Information Science",
        "year_of_study": 3,
        "cgpa": 9.1,
        "bio": "Systems architect in training",
        "github_url": "https://github.com/devstudent"
    }, headers=stu_headers)

    client.post("/api/profile/skills", json={
        "name": f"GoLang_{u}",
        "category": "Backend",
        "proficiency_level": "advanced"
    }, headers=stu_headers)

    client.post("/api/profile/projects", json={
        "title": "High-Performance Distributed Cache",
        "tech_stack": "Go, Raft, gRPC",
        "repo_url": "https://github.com/devstudent/cache"
    }, headers=stu_headers)

    # Faculty assigns student
    assign_res = client.post(
        "/api/faculty/advisees",
        json={"student_email": f"dev_student_{u}@campusorbit.edu", "notes": "Candidate demonstrates strong systems skills", "is_student_visible": False},
        headers=fac_headers
    )
    assert assign_res.status_code == 201
    stu_id = assign_res.json()["student_id"]

    # Faculty inspects complete portfolio
    portfolio_res = client.get(f"/api/faculty/advisees/{stu_id}", headers=fac_headers)
    assert portfolio_res.status_code == 200
    portfolio = portfolio_res.json()
    assert portfolio["student"]["department"] == "Information Science"
    assert portfolio["student"]["cgpa"] == 9.1
    assert len(portfolio["skills"]) >= 1
    assert len(portfolio["projects"]) >= 1
    assert portfolio["projects"][0]["title"] == "High-Performance Distributed Cache"
    assert "password" not in str(portfolio).lower()
    assert "hashed_password" not in str(portfolio).lower()

    # Verify student cannot view private notes
    stu_mentorship_1 = client.get("/api/student/mentorship", headers=stu_headers).json()
    assert len(stu_mentorship_1) == 0

    # Faculty makes notes student-visible
    update_res = client.put(
        f"/api/faculty/advisees/{stu_id}/feedback",
        json={"notes": "Recommended for Systems Internship with Acme Corp.", "is_student_visible": True},
        headers=fac_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["is_student_visible"] is True

    # Student can now see the feedback
    stu_mentorship_2 = client.get("/api/student/mentorship", headers=stu_headers).json()
    assert len(stu_mentorship_2) == 1
    assert stu_mentorship_2[0]["notes"] == "Recommended for Systems Internship with Acme Corp."
    assert stu_mentorship_2[0]["faculty_name"] == "Prof Mentor"

    # Student cannot modify feedback -> 403
    stu_mod = client.put(
        f"/api/faculty/advisees/{stu_id}/feedback",
        json={"notes": "Tampered note"},
        headers=stu_headers
    )
    assert stu_mod.status_code == 403

def test_unassign_advisee():
    u = uuid.uuid4().hex[:6]
    fac_token = get_auth_token(f"advisor_{u}@campusorbit.edu", role="faculty", name="Prof Advisor")
    fac_headers = {"Authorization": f"Bearer {fac_token}"}
    stu_email = f"coop_stu_{u}@campusorbit.edu"
    get_auth_token(stu_email, role="student", name="Coop Student")

    assign = client.post("/api/faculty/advisees", json={"student_email": stu_email}, headers=fac_headers)
    assert assign.status_code == 201
    stu_id = assign.json()["student_id"]

    # Verify present
    list_1 = client.get("/api/faculty/advisees", headers=fac_headers).json()
    assert any(a["student_id"] == stu_id for a in list_1)

    # Unassign
    del_res = client.delete(f"/api/faculty/advisees/{stu_id}", headers=fac_headers)
    assert del_res.status_code == 200

    # Verify removed
    list_2 = client.get("/api/faculty/advisees", headers=fac_headers).json()
    assert not any(a["student_id"] == stu_id for a in list_2)

    # Accessing portfolio now returns 404
    assert client.get(f"/api/faculty/advisees/{stu_id}", headers=fac_headers).status_code == 404
