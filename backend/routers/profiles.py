from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import database, models, schemas, security

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.get("/me", response_model=schemas.StudentProfileResponse)
def get_my_profile(
    current_user: models.User = Depends(security.require_roles(models.UserRole.student)),
    db: Session = Depends(database.get_db)
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile."
        )
    return profile

@router.put("/me", response_model=schemas.StudentProfileResponse)
def update_or_create_my_profile(
    profile_data: schemas.StudentProfileUpdate,
    current_user: models.User = Depends(security.require_roles(models.UserRole.student)),
    db: Session = Depends(database.get_db)
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    update_data = profile_data.model_dump(exclude_unset=True)

    if not profile:
        profile = models.StudentProfile(user_id=current_user.id, **update_data)
        db.add(profile)
    else:
        for key, value in update_data.items():
            setattr(profile, key, value)

    try:
        db.commit()
        db.refresh(profile)
        return profile
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not update profile: {str(e)}"
        )

@router.post("/skills", response_model=schemas.StudentSkillResponse, status_code=status.HTTP_201_CREATED)
def add_skill_to_profile(
    skill_data: schemas.StudentSkillCreate,
    current_user: models.User = Depends(security.require_roles(models.UserRole.student)),
    db: Session = Depends(database.get_db)
):
    # Ensure student profile exists
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    clean_name = skill_data.name.strip()
    clean_category = skill_data.category.strip()

    # Find or create skill (case-insensitive name check)
    skill = db.query(models.Skill).filter(func.lower(models.Skill.name) == clean_name.lower()).first()
    if not skill:
        skill = models.Skill(name=clean_name, category=clean_category)
        db.add(skill)
        db.commit()
        db.refresh(skill)

    # Check for duplicate assignment
    existing_assignment = db.query(models.StudentSkill).filter(
        models.StudentSkill.student_profile_id == profile.id,
        models.StudentSkill.skill_id == skill.id
    ).first()

    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Skill '{skill.name}' is already added to your profile."
        )

    student_skill = models.StudentSkill(
        student_profile_id=profile.id,
        skill_id=skill.id,
        proficiency_level=skill_data.proficiency_level
    )
    db.add(student_skill)
    db.commit()
    db.refresh(student_skill)
    return student_skill

@router.delete("/skills/{student_skill_id}", status_code=status.HTTP_200_OK)
def remove_skill_from_profile(
    student_skill_id: int,
    current_user: models.User = Depends(security.require_roles(models.UserRole.student)),
    db: Session = Depends(database.get_db)
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    student_skill = db.query(models.StudentSkill).filter(
        models.StudentSkill.id == student_skill_id,
        models.StudentSkill.student_profile_id == profile.id
    ).first()

    if not student_skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill assignment not found"
        )

    db.delete(student_skill)
    db.commit()
    return {"message": "Skill removed successfully"}

@router.post("/projects", response_model=schemas.StudentProjectResponse, status_code=status.HTTP_201_CREATED)
def add_project_to_profile(
    project_data: schemas.StudentProjectCreate,
    current_user: models.User = Depends(security.require_roles(models.UserRole.student)),
    db: Session = Depends(database.get_db)
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.StudentProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    project = models.StudentProject(
        student_profile_id=profile.id,
        title=project_data.title.strip(),
        description=project_data.description.strip() if project_data.description else None,
        tech_stack=project_data.tech_stack.strip() if project_data.tech_stack else None,
        repo_url=project_data.repo_url.strip() if project_data.repo_url else None,
        live_url=project_data.live_url.strip() if project_data.live_url else None,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/projects/{project_id}", status_code=status.HTTP_200_OK)
def delete_project_from_profile(
    project_id: int,
    current_user: models.User = Depends(security.require_roles(models.UserRole.student)),
    db: Session = Depends(database.get_db)
):
    profile = db.query(models.StudentProfile).filter(models.StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    project = db.query(models.StudentProject).filter(
        models.StudentProject.id == project_id,
        models.StudentProject.student_profile_id == profile.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
