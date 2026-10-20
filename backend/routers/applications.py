from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List
import database, models, schemas, security

router = APIRouter(prefix="/api/applications", tags=["applications"])

@router.post("/{opportunity_id}", response_model=schemas.ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_opportunity(
    opportunity_id: int,
    app_data: schemas.ApplicationCreate = None,
    current_user: models.User = Depends(security.require_roles(models.UserRole.student)),
    db: Session = Depends(database.get_db)
):
    opportunity = db.query(models.Internship).filter(models.Internship.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )

    if not opportunity.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot apply to an inactive opportunity"
        )

    # Check deadline
    if opportunity.deadline:
        now = datetime.now(timezone.utc)
        # Ensure opportunity.deadline has timezone info if comparing
        deadline = opportunity.deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if deadline < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application deadline has passed"
            )

    # Check duplicate application
    existing_application = db.query(models.Application).filter(
        models.Application.internship_id == opportunity_id,
        models.Application.student_id == current_user.id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this opportunity"
        )

    application = models.Application(
        internship_id=opportunity_id,
        student_id=current_user.id,
        status=models.ApplicationStatus.applied,
        notes=app_data.notes.strip() if app_data and app_data.notes else None
    )
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

@router.get("/me", response_model=List[schemas.ApplicationWithOpportunityResponse])
def get_my_applications(
    current_user: models.User = Depends(security.require_roles(models.UserRole.student)),
    db: Session = Depends(database.get_db)
):
    applications = db.query(models.Application).filter(
        models.Application.student_id == current_user.id
    ).order_by(models.Application.applied_at.desc()).all()

    return applications

@router.patch("/{application_id}/status", response_model=schemas.ApplicationResponse)
def update_application_status(
    application_id: int,
    status_data: schemas.ApplicationStatusUpdate,
    current_user: models.User = Depends(security.require_roles(models.UserRole.placement_officer, models.UserRole.admin)),
    db: Session = Depends(database.get_db)
):
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    # Verify that the placement officer posted this opportunity
    if application.internship.posted_by_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update status for this opportunity"
        )

    application.status = status_data.status
    db.commit()
    db.refresh(application)
    return application
