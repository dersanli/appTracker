import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Text, DateTime, Integer, Numeric, ForeignKey, Enum as SAEnum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


def utcnow():
    return datetime.now(timezone.utc)


class JobType(str, enum.Enum):
    permanent = "permanent"
    inside_ir35 = "inside_ir35"
    outside_ir35 = "outside_ir35"


class WorkArrangement(str, enum.Enum):
    remote = "remote"
    hybrid = "hybrid"


class SalaryType(str, enum.Enum):
    daily_rate = "daily_rate"
    annual = "annual"


class ApplicationStatus(str, enum.Enum):
    applied = "applied"
    recruiter_chat = "recruiter_chat"
    interview = "interview"
    offer = "offer"
    offer_accepted = "offer_accepted"
    offer_rejected = "offer_rejected"
    rejected = "rejected"
    withdrawn = "withdrawn"


class DateType(str, enum.Enum):
    recruiter_call = "recruiter_call"
    interview = "interview"
    other = "other"


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    role = Column(Text, nullable=False)
    job_description = Column(Text, nullable=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    recruiter_id = Column(UUID(as_uuid=True), ForeignKey("recruiters.id", ondelete="SET NULL"), nullable=True)
    job_type = Column(SAEnum(JobType, name="job_type", create_type=False), nullable=True)
    work_arrangement = Column(SAEnum(WorkArrangement, name="work_arrangement", create_type=False), nullable=True)
    hybrid_days_per_week = Column(Integer, nullable=True)
    salary_type = Column(SAEnum(SalaryType, name="salary_type", create_type=False), nullable=True)
    salary_amount = Column(Numeric(12, 2), nullable=True)
    current_status = Column(
        SAEnum(ApplicationStatus, name="application_status", create_type=False),
        nullable=False,
        default=ApplicationStatus.applied,
    )
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    client = relationship("Client", back_populates="applications", lazy="noload")
    recruiter = relationship("Recruiter", back_populates="applications", lazy="noload")
    status_history = relationship(
        "ApplicationStatusHistory",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    important_dates = relationship(
        "ImportantDate",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="noload",
    )
    cv = relationship(
        "ApplicationCV",
        back_populates="application",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="noload",
    )
    prep_notes = relationship(
        "ApplicationPrepNote",
        back_populates="application",
        cascade="all, delete-orphan",
        lazy="noload",
    )


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status = Column(SAEnum(ApplicationStatus, name="application_status", create_type=False), nullable=False)
    notes = Column(Text, nullable=True)
    changed_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    application = relationship("Application", back_populates="status_history", lazy="noload")
    important_dates = relationship(
        "ImportantDate",
        back_populates="status_history",
        lazy="noload",
    )


class ImportantDate(Base):
    __tablename__ = "important_dates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status_history_id = Column(
        UUID(as_uuid=True),
        ForeignKey("application_status_history.id", ondelete="SET NULL"),
        nullable=True,
    )
    title = Column(Text, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    type = Column(SAEnum(DateType, name="date_type", create_type=False), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    application = relationship("Application", back_populates="important_dates", lazy="noload")
    status_history = relationship("ApplicationStatusHistory", back_populates="important_dates", lazy="noload")
