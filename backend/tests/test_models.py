import pytest
from sqlalchemy.exc import IntegrityError
import models

def test_student_profile_creation_and_relationship(db_session):
    user = models.User(
        email="student_model@campusorbit.com",
        full_name="Model Student",
        hashed_password="hashedsecret",
        role=models.UserRole.student
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    profile = models.StudentProfile(
        user_id=user.id,
        department="Computer Science & Engineering",
        year_of_study=3,
        cgpa=8.75,
        bio="Passionate full stack developer",
        github_url="https://github.com/modelstudent",
        linkedin_url="https://linkedin.com/in/modelstudent"
    )
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)

    # Test bidirectional relationships
    assert profile.user.email == "student_model@campusorbit.com"
    assert user.student_profile.department == "Computer Science & Engineering"
    assert user.student_profile.cgpa == 8.75

    # Verify one profile per user (unique user_id constraint)
    duplicate_profile = models.StudentProfile(
        user_id=user.id,
        department="Information Technology",
        year_of_study=4
    )
    db_session.add(duplicate_profile)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_skills_and_student_skills(db_session):
    user = models.User(
        email="skills_test@campusorbit.com",
        full_name="Skill Tester",
        hashed_password="hashedsecret",
        role=models.UserRole.student
    )
    db_session.add(user)
    db_session.commit()

    profile = models.StudentProfile(user_id=user.id, department="CSE")
    db_session.add(profile)
    db_session.commit()

    skill = models.Skill(name="Python", category="Backend")
    db_session.add(skill)
    db_session.commit()

    student_skill = models.StudentSkill(
        student_profile_id=profile.id,
        skill_id=skill.id,
        proficiency_level=models.SkillProficiency.advanced
    )
    db_session.add(student_skill)
    db_session.commit()

    assert len(profile.skills) == 1
    assert profile.skills[0].skill.name == "Python"
    assert profile.skills[0].proficiency_level == models.SkillProficiency.advanced

    # Test duplicate skill association constraint
    duplicate_association = models.StudentSkill(
        student_profile_id=profile.id,
        skill_id=skill.id,
        proficiency_level=models.SkillProficiency.beginner
    )
    db_session.add(duplicate_association)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_student_projects(db_session):
    user = models.User(
        email="project_test@campusorbit.com",
        full_name="Project Tester",
        hashed_password="hashedsecret",
        role=models.UserRole.student
    )
    db_session.add(user)
    db_session.commit()

    profile = models.StudentProfile(user_id=user.id)
    db_session.add(profile)
    db_session.commit()

    project = models.StudentProject(
        student_profile_id=profile.id,
        title="Campus Career Portal",
        description="Full stack career platform built with FastAPI and React",
        tech_stack="FastAPI, React, PostgreSQL",
        repo_url="https://github.com/project/campusorbit"
    )
    db_session.add(project)
    db_session.commit()

    assert len(profile.projects) == 1
    assert profile.projects[0].title == "Campus Career Portal"
    assert profile.projects[0].student_profile.id == profile.id

def test_internship_and_application_workflow(db_session):
    # Create placement officer
    officer = models.User(
        email="officer@campusorbit.com",
        full_name="Placement Officer",
        hashed_password="hashedsecret",
        role=models.UserRole.placement_officer
    )
    # Create student
    student = models.User(
        email="applicant@campusorbit.com",
        full_name="Applicant Student",
        hashed_password="hashedsecret",
        role=models.UserRole.student
    )
    db_session.add_all([officer, student])
    db_session.commit()

    # Create internship listing
    internship = models.Internship(
        title="Software Engineer Intern",
        company_name="Orbit Technologies",
        location="Remote",
        opportunity_type=models.OpportunityType.internship,
        description="Work on cloud backend systems and microservices",
        stipend="₹30,000/month",
        min_cgpa=7.5,
        is_active=True,
        posted_by_id=officer.id
    )
    db_session.add(internship)
    db_session.commit()

    assert internship.posted_by.email == "officer@campusorbit.com"
    assert len(officer.posted_internships) == 1

    # Create application
    application = models.Application(
        internship_id=internship.id,
        student_id=student.id,
        status=models.ApplicationStatus.applied,
        notes="Excited for this cloud engineering role!"
    )
    db_session.add(application)
    db_session.commit()

    # Verify relationships
    assert len(internship.applications) == 1
    assert internship.applications[0].student.email == "applicant@campusorbit.com"
    assert application.status == models.ApplicationStatus.applied

    # Verify duplicate application prevention
    duplicate_app = models.Application(
        internship_id=internship.id,
        student_id=student.id,
        status=models.ApplicationStatus.applied
    )
    db_session.add(duplicate_app)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
