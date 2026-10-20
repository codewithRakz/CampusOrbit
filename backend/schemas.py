from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from models import UserRole, SkillProficiency, OpportunityType, ApplicationStatus

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: UserRole = Field(default=UserRole.student)

    @field_validator("role")
    @classmethod
    def prevent_admin_registration(cls, v):
        if v == UserRole.admin:
            raise ValueError("Admin accounts cannot be created via public registration.")
        return v

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

# Skill Schemas
class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    category: str = Field(..., min_length=1, max_length=50)

class SkillResponse(SkillBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# StudentSkill Schemas
class StudentSkillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    category: str = Field(..., min_length=1, max_length=50)
    proficiency_level: SkillProficiency = Field(default=SkillProficiency.beginner)

class StudentSkillResponse(BaseModel):
    id: int
    student_profile_id: int
    skill_id: int
    skill: SkillResponse
    proficiency_level: SkillProficiency
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# StudentProject Schemas
class StudentProjectCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = Field(default=None, max_length=2000)
    tech_stack: Optional[str] = Field(default=None, max_length=255)
    repo_url: Optional[str] = Field(default=None, max_length=255)
    live_url: Optional[str] = Field(default=None, max_length=255)

class StudentProjectResponse(BaseModel):
    id: int
    student_profile_id: int
    title: str
    description: Optional[str] = None
    tech_stack: Optional[str] = None
    repo_url: Optional[str] = None
    live_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# StudentProfile Schemas
class StudentProfileUpdate(BaseModel):
    department: Optional[str] = Field(default=None, max_length=100)
    year_of_study: Optional[int] = Field(default=None, ge=1, le=5)
    cgpa: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    bio: Optional[str] = Field(default=None, max_length=1000)
    github_url: Optional[str] = Field(default=None, max_length=255)
    linkedin_url: Optional[str] = Field(default=None, max_length=255)

class StudentProfileResponse(BaseModel):
    id: int
    user_id: int
    department: Optional[str] = None
    year_of_study: Optional[int] = None
    cgpa: Optional[float] = None
    bio: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    skills: List[StudentSkillResponse] = []
    projects: List[StudentProjectResponse] = []

    model_config = ConfigDict(from_attributes=True)

# Opportunity Schemas
class OpportunityBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    company_name: str = Field(..., min_length=2, max_length=150)
    location: str = Field(..., min_length=2, max_length=100)
    opportunity_type: OpportunityType = Field(default=OpportunityType.internship)
    description: str = Field(..., min_length=10, max_length=5000)
    stipend: Optional[str] = Field(default=None, max_length=100)
    min_cgpa: float = Field(default=0.0, ge=0.0, le=10.0)
    deadline: Optional[datetime] = None

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=150)
    company_name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    location: Optional[str] = Field(default=None, min_length=2, max_length=100)
    opportunity_type: Optional[OpportunityType] = None
    description: Optional[str] = Field(default=None, min_length=10, max_length=5000)
    stipend: Optional[str] = Field(default=None, max_length=100)
    min_cgpa: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    deadline: Optional[datetime] = None
    is_active: Optional[bool] = None

class OpportunityResponse(OpportunityBase):
    id: int
    is_active: bool
    posted_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# Application Schemas
class ApplicationCreate(BaseModel):
    notes: Optional[str] = Field(default=None, max_length=1000)

class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus

class ApplicationResponse(BaseModel):
    id: int
    internship_id: int
    student_id: int
    status: ApplicationStatus
    notes: Optional[str] = None
    applied_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ApplicationWithOpportunityResponse(ApplicationResponse):
    internship: OpportunityResponse

class ApplicationWithApplicantResponse(ApplicationResponse):
    student: UserResponse

# Faculty Advisees & Mentorship Schemas
class FacultyAdviseeAssign(BaseModel):
    student_email: EmailStr
    notes: Optional[str] = Field(default=None, max_length=2000)
    is_student_visible: bool = Field(default=False)

class FacultyFeedbackUpdate(BaseModel):
    notes: Optional[str] = Field(default=None, max_length=2000)
    is_student_visible: bool = Field(default=False)

class AdviseeStudentSummary(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    department: Optional[str] = None
    year_of_study: Optional[int] = None
    cgpa: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)

class FacultyAdviseeResponse(BaseModel):
    id: int
    faculty_id: int
    student_id: int
    notes: Optional[str] = None
    is_student_visible: bool
    assigned_at: datetime
    updated_at: Optional[datetime] = None
    student: AdviseeStudentSummary

    model_config = ConfigDict(from_attributes=True)

class AdviseePortfolioResponse(BaseModel):
    student: AdviseeStudentSummary
    profile: Optional[StudentProfileResponse] = None
    skills: List[StudentSkillResponse] = []
    projects: List[StudentProjectResponse] = []
    applications: List[ApplicationWithOpportunityResponse] = []
    mentorship_notes: Optional[str] = None
    is_student_visible: bool = False
    assigned_at: datetime
    updated_at: Optional[datetime] = None

class StudentMentorshipResponse(BaseModel):
    id: int
    faculty_name: str
    faculty_email: str
    notes: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

