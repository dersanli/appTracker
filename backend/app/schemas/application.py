from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from app.models.application import (
    JobType,
    WorkArrangement,
    SalaryType,
    ApplicationStatus,
    DateType,
)


# ── Application ───────────────────────────────────────────────────────────────

class ApplicationBase(BaseModel):
    role: str
    job_description: str | None = None
    client_id: UUID | None = None
    recruiter_id: UUID | None = None
    job_type: JobType | None = None
    work_arrangement: WorkArrangement | None = None
    hybrid_days_per_week: int | None = None
    salary_type: SalaryType | None = None
    salary_amount: Decimal | None = None
    notes: str | None = None


class ApplicationCreate(ApplicationBase):
    current_status: ApplicationStatus = ApplicationStatus.applied


class ApplicationUpdate(BaseModel):
    role: str | None = None
    job_description: str | None = None
    client_id: UUID | None = None
    recruiter_id: UUID | None = None
    job_type: JobType | None = None
    work_arrangement: WorkArrangement | None = None
    hybrid_days_per_week: int | None = None
    salary_type: SalaryType | None = None
    salary_amount: Decimal | None = None
    current_status: ApplicationStatus | None = None
    notes: str | None = None


class RecruiterNested(BaseModel):
    id: UUID
    name: str
    agency_name: str | None = None
    email: str | None = None
    phone: str | None = None
    model_config = {"from_attributes": True}


class ClientNested(BaseModel):
    id: UUID
    company_name: str
    contact_name: str | None = None
    email: str | None = None
    model_config = {"from_attributes": True}


class ApplicationRead(ApplicationBase):
    id: UUID
    user_id: UUID
    current_status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    recruiter: RecruiterNested | None = None
    client: ClientNested | None = None

    model_config = {"from_attributes": True}


# ── Status history ────────────────────────────────────────────────────────────

class StatusHistoryCreate(BaseModel):
    status: ApplicationStatus
    notes: str | None = None
    changed_at: datetime | None = None


class StatusHistoryRead(BaseModel):
    id: UUID
    application_id: UUID
    status: ApplicationStatus
    notes: str | None = None
    changed_at: datetime

    model_config = {"from_attributes": True}


# ── Important dates ───────────────────────────────────────────────────────────

class ImportantDateCreate(BaseModel):
    title: str
    date: datetime
    type: DateType
    notes: str | None = None
    status_history_id: UUID | None = None


class ImportantDateUpdate(BaseModel):
    title: str | None = None
    date: datetime | None = None
    type: DateType | None = None
    notes: str | None = None
    status_history_id: UUID | None = None


class ImportantDateRead(BaseModel):
    id: UUID
    application_id: UUID
    status_history_id: UUID | None = None
    title: str
    date: datetime
    type: DateType
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
