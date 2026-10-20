from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import database, models, schemas, security

router = APIRouter(tags=["faculty"])

def _build_advisee_summary(student_user: models.User) -> schemas.AdviseeStudentSummary:
    profile = student_user.student_profile
    return schemas.AdviseeStudentSummary(
        id=student_user.id,
        email=student_user.email,
        full_name=student_user.full_name,
        department=profile.department if profile else None,
        year_of_study=profile.year_of_study if profile else None,
        cgpa=profile.cgpa if profile else None,
    )

def _build_advisee_response(advisee: models.FacultyAdvisee) -> schemas.FacultyAdviseeResponse:
    return schemas.FacultyAdviseeResponse(
        id=advisee.id,
        faculty_id=advisee.faculty_id,
        student_id=advisee.student_id,
        notes=advisee.notes,
        is_student_visible=advisee.is_student_visible,
        assigned_at=advisee.assigned_at,
        updated_at=advisee.updated_at,
        student=_build_advisee_summary(advisee.student),
    )

@router.get("/api/faculty/advisees", response_model=List[schemas.FacultyAdviseeResponse])
def list_faculty_advisees(
    search: Optional[str] = Query(None, description="Search advisees by name or email"),
    current_user: models.User = Depends(security.require_roles(models.UserRole.faculty, models.UserRole.admin)),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.FacultyAdvisee).filter(models.FacultyAdvisee.faculty_id == current_user.id)
    advisees = query.order_by(models.FacultyAdvisee.assigned_at.desc()).all()

    results = []
    for adv in advisees:
        summary = _build_advisee_summary(adv.student)
        if search:
            q = search.strip().lower()
            if q not in adv.student.full_name.lower() and q not in adv.student.email.lower():
                continue
        results.append(
            schemas.FacultyAdviseeResponse(
                id=adv.id,
                faculty_id=adv.faculty_id,
                student_id=adv.student_id,
                notes=adv.notes,
                is_student_visible=adv.is_student_visible,
                assigned_at=adv.assigned_at,
                updated_at=adv.updated_at,
                student=summary,
            )
        )
    return results

@router.post("/api/faculty/advisees", response_model=schemas.FacultyAdviseeResponse, status_code=status.HTTP_201_CREATED)
def assign_advisee(
    assign_data: schemas.FacultyAdviseeAssign,
    current_user: models.User = Depends(security.require_roles(models.UserRole.faculty, models.UserRole.admin)),
    db: Session = Depends(database.get_db)
):
    target_email = assign_data.student_email.strip().lower()

    # 1. Validate that the supplied email belongs to an existing user
    student_user = db.query(models.User).filter(func.lower(models.User.email) == target_email).first()
    if not student_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with email '{assign_data.student_email}' was not found"
        )

    # 2. Validate that user has the student role
    if student_user.role != models.UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{assign_data.student_email}' is not a student (role: {student_user.role})"
        )

    # 3. Check for duplicate assignment under this faculty member
    existing = db.query(models.FacultyAdvisee).filter(
        models.FacultyAdvisee.faculty_id == current_user.id,
        models.FacultyAdvisee.student_id == student_user.id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student '{student_user.full_name}' is already in your advisee cohort"
        )

    # 4. Create advisee assignment
    advisee = models.FacultyAdvisee(
        faculty_id=current_user.id,
        student_id=student_user.id,
        notes=assign_data.notes.strip() if assign_data.notes else None,
        is_student_visible=assign_data.is_student_visible,
    )
    db.add(advisee)
    db.commit()
    db.refresh(advisee)

    return _build_advisee_response(advisee)

@router.get("/api/faculty/advisees/{student_id}", response_model=schemas.AdviseePortfolioResponse)
def get_advisee_portfolio(
    student_id: int,
    current_user: models.User = Depends(security.require_roles(models.UserRole.faculty, models.UserRole.admin)),
    db: Session = Depends(database.get_db)
):
    # Enforce faculty ownership
    advisee = db.query(models.FacultyAdvisee).filter(
        models.FacultyAdvisee.faculty_id == current_user.id,
        models.FacultyAdvisee.student_id == student_id
    ).first()

    if not advisee and current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advisee not found or not assigned to you"
        )

    student_user = db.query(models.User).filter(models.User.id == student_id).first()
    if not student_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )

    summary = _build_advisee_summary(student_user)
    profile = student_user.student_profile
    skills = profile.skills if profile else []
    projects = profile.projects if profile else []
    applications = student_user.applications

    return schemas.AdviseePortfolioResponse(
        student=summary,
        profile=profile,
        skills=skills,
        projects=projects,
        applications=applications,
        mentorship_notes=advisee.notes if advisee else None,
        is_student_visible=advisee.is_student_visible if advisee else False,
        assigned_at=advisee.assigned_at if advisee else student_user.created_at,
        updated_at=advisee.updated_at if advisee else None,
    )

@router.put("/api/faculty/advisees/{student_id}/feedback", response_model=schemas.FacultyAdviseeResponse)
def update_mentorship_feedback(
    student_id: int,
    feedback_data: schemas.FacultyFeedbackUpdate,
    current_user: models.User = Depends(security.require_roles(models.UserRole.faculty, models.UserRole.admin)),
    db: Session = Depends(database.get_db)
):
    # Enforce faculty ownership
    advisee = db.query(models.FacultyAdvisee).filter(
        models.FacultyAdvisee.faculty_id == current_user.id,
        models.FacultyAdvisee.student_id == student_id
    ).first()

    if not advisee and current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advisee not found or not assigned to you"
        )

    advisee.notes = feedback_data.notes.strip() if feedback_data.notes else None
    advisee.is_student_visible = feedback_data.is_student_visible
    db.commit()
    db.refresh(advisee)

    return _build_advisee_response(advisee)

@router.delete("/api/faculty/advisees/{student_id}", status_code=status.HTTP_200_OK)
def unassign_advisee(
    student_id: int,
    current_user: models.User = Depends(security.require_roles(models.UserRole.faculty, models.UserRole.admin)),
    db: Session = Depends(database.get_db)
):
    # Enforce faculty ownership
    advisee = db.query(models.FacultyAdvisee).filter(
        models.FacultyAdvisee.faculty_id == current_user.id,
        models.FacultyAdvisee.student_id == student_id
    ).first()

    if not advisee and current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advisee not found or not assigned to you"
        )

    db.delete(advisee)
    db.commit()
    return {"message": "Advisee unassigned successfully"}

@router.get("/api/student/mentorship", response_model=List[schemas.StudentMentorshipResponse])
def get_my_mentorship_feedback(
    current_user: models.User = Depends(security.require_roles(models.UserRole.student)),
    db: Session = Depends(database.get_db)
):
    # Students can only view notes where is_student_visible == True
    records = db.query(models.FacultyAdvisee).filter(
        models.FacultyAdvisee.student_id == current_user.id,
        models.FacultyAdvisee.is_student_visible == True
    ).all()

    results = []
    for r in records:
        results.append(
            schemas.StudentMentorshipResponse(
                id=r.id,
                faculty_name=r.faculty.full_name,
                faculty_email=r.faculty.email,
                notes=r.notes,
                updated_at=r.updated_at or r.assigned_at,
            )
        )
    return results
