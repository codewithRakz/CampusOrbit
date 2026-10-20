from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    DateTime,
    Float,
    Text,
    Boolean,
    ForeignKey,
    CheckConstraint,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base

class UserRole(str, enum.Enum):
    student = "student"
    faculty = "faculty"
    placement_officer = "placement_officer"
    admin = "admin"

class SkillProficiency(str, enum.Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"

class OpportunityType(str, enum.Enum):
    internship = "internship"
    research = "research"
    placement = "placement"

class ApplicationStatus(str, enum.Enum):
    applied = "applied"
    under_review = "under_review"
    shortlisted = "shortlisted"
    accepted = "accepted"
    rejected = "rejected"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.student, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    posted_internships = relationship("Internship", back_populates="posted_by", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    faculty_advisees = relationship("FacultyAdvisee", foreign_keys="[FacultyAdvisee.faculty_id]", back_populates="faculty", cascade="all, delete-orphan")
    mentorship_assignments = relationship("FacultyAdvisee", foreign_keys="[FacultyAdvisee.student_id]", back_populates="student", cascade="all, delete-orphan")

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    department = Column(String(100), nullable=True)
    year_of_study = Column(Integer, nullable=True)
    cgpa = Column(Float, nullable=True)
    bio = Column(Text, nullable=True)
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("cgpa >= 0.0 AND cgpa <= 10.0", name="check_cgpa_range"),
        CheckConstraint("year_of_study >= 1 AND year_of_study <= 5", name="check_year_of_study_range"),
    )

    # Relationships
    user = relationship("User", back_populates="student_profile")
    skills = relationship("StudentSkill", back_populates="student_profile", cascade="all, delete-orphan")
    projects = relationship("StudentProject", back_populates="student_profile", cascade="all, delete-orphan")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    student_skills = relationship("StudentSkill", back_populates="skill", cascade="all, delete-orphan")

class StudentSkill(Base):
    __tablename__ = "student_skills"

    id = Column(Integer, primary_key=True, index=True)
    student_profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, index=True)
    proficiency_level = Column(
        Enum(SkillProficiency, name="skillproficiency"),
        default=SkillProficiency.beginner,
        nullable=False
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("student_profile_id", "skill_id", name="uq_student_skill"),
    )

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="skills")
    skill = relationship("Skill", back_populates="student_skills")

class StudentProject(Base):
    __tablename__ = "student_projects"

    id = Column(Integer, primary_key=True, index=True)
    student_profile_id = Column(Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    tech_stack = Column(String(255), nullable=True)
    repo_url = Column(String(255), nullable=True)
    live_url = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="projects")

class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False, index=True)
    company_name = Column(String(150), nullable=False, index=True)
    location = Column(String(100), nullable=False)
    opportunity_type = Column(
        Enum(OpportunityType, name="opportunitytype"),
        default=OpportunityType.internship,
        nullable=False,
        index=True
    )
    description = Column(Text, nullable=False)
    stipend = Column(String(100), nullable=True)
    min_cgpa = Column(Float, default=0.0, nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    posted_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        CheckConstraint("min_cgpa >= 0.0 AND min_cgpa <= 10.0", name="check_min_cgpa_range"),
    )

    # Relationships
    posted_by = relationship("User", back_populates="posted_internships")
    applications = relationship("Application", back_populates="internship", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    internship_id = Column(Integer, ForeignKey("internships.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(
        Enum(ApplicationStatus, name="applicationstatus"),
        default=ApplicationStatus.applied,
        nullable=False,
        index=True
    )
    notes = Column(Text, nullable=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("internship_id", "student_id", name="uq_internship_student_application"),
    )

    # Relationships
    internship = relationship("Internship", back_populates="applications")
    student = relationship("User", back_populates="applications")

class FacultyAdvisee(Base):
    __tablename__ = "faculty_advisees"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    is_student_visible = Column(Boolean, default=False, nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("faculty_id", "student_id", name="uq_faculty_student_advisee"),
    )

    # Relationships
    faculty = relationship("User", foreign_keys=[faculty_id], back_populates="faculty_advisees")
    student = relationship("User", foreign_keys=[student_id], back_populates="mentorship_assignments")

