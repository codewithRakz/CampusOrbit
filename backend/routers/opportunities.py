from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import database, models, schemas, security

router = APIRouter(prefix="/api/opportunities", tags=["opportunities"])

@router.get("", response_model=List[schemas.OpportunityResponse])
def list_opportunities(
    keyword: Optional[str] = Query(None, description="Search keyword in title, company or description"),
    location: Optional[str] = Query(None, description="Filter by location"),
    opportunity_type: Optional[models.OpportunityType] = Query(None, description="Filter by opportunity type"),
    max_min_cgpa: Optional[float] = Query(None, ge=0.0, le=10.0, description="Opportunities requiring at most this CGPA"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Internship)

    # Students and faculty can only discover active opportunities
    if current_user.role not in [models.UserRole.placement_officer, models.UserRole.admin]:
        query = query.filter(models.Internship.is_active == True)

    if keyword:
        pattern = f"%{keyword.strip()}%"
        query = query.filter(
            or_(
                models.Internship.title.ilike(pattern),
                models.Internship.company_name.ilike(pattern),
                models.Internship.description.ilike(pattern)
            )
        )

    if location:
        query = query.filter(models.Internship.location.ilike(f"%{location.strip()}%"))

    if opportunity_type:
        query = query.filter(models.Internship.opportunity_type == opportunity_type)

    if max_min_cgpa is not None:
        query = query.filter(models.Internship.min_cgpa <= max_min_cgpa)

    opportunities = query.order_by(models.Internship.created_at.desc()).offset(skip).limit(limit).all()
    return opportunities

@router.get("/{opportunity_id}", response_model=schemas.OpportunityResponse)
def get_opportunity(
    opportunity_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(database.get_db)
):
    opportunity = db.query(models.Internship).filter(models.Internship.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )

    if not opportunity.is_active and current_user.role not in [models.UserRole.placement_officer, models.UserRole.admin]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )

    return opportunity

@router.post("", response_model=schemas.OpportunityResponse, status_code=status.HTTP_201_CREATED)
def create_opportunity(
    opportunity_data: schemas.OpportunityCreate,
    current_user: models.User = Depends(security.require_roles(models.UserRole.placement_officer, models.UserRole.admin)),
    db: Session = Depends(database.get_db)
):
    opportunity = models.Internship(
        posted_by_id=current_user.id,
        is_active=True,
        **opportunity_data.model_dump()
    )
    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)
    return opportunity

@router.put("/{opportunity_id}", response_model=schemas.OpportunityResponse)
def update_opportunity(
    opportunity_id: int,
    opportunity_data: schemas.OpportunityUpdate,
    current_user: models.User = Depends(security.require_roles(models.UserRole.placement_officer, models.UserRole.admin)),
    db: Session = Depends(database.get_db)
):
    opportunity = db.query(models.Internship).filter(models.Internship.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )

    # Only creator officer or admin can edit
    if opportunity.posted_by_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to edit this opportunity"
        )

    update_dict = opportunity_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(opportunity, field, value)

    db.commit()
    db.refresh(opportunity)
    return opportunity

@router.delete("/{opportunity_id}", status_code=status.HTTP_200_OK)
def deactivate_opportunity(
    opportunity_id: int,
    current_user: models.User = Depends(security.require_roles(models.UserRole.placement_officer, models.UserRole.admin)),
    db: Session = Depends(database.get_db)
):
    opportunity = db.query(models.Internship).filter(models.Internship.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )

    if opportunity.posted_by_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to deactivate this opportunity"
        )

    opportunity.is_active = False
    db.commit()
    return {"message": "Opportunity deactivated successfully"}

@router.get("/{opportunity_id}/applications", response_model=List[schemas.ApplicationWithApplicantResponse])
def get_opportunity_applications(
    opportunity_id: int,
    current_user: models.User = Depends(security.require_roles(models.UserRole.placement_officer, models.UserRole.admin)),
    db: Session = Depends(database.get_db)
):
    opportunity = db.query(models.Internship).filter(models.Internship.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found"
        )

    if opportunity.posted_by_id != current_user.id and current_user.role != models.UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view applicants for this opportunity"
        )

    applications = db.query(models.Application).filter(
        models.Application.internship_id == opportunity_id
    ).order_by(models.Application.applied_at.desc()).all()

    return applications
