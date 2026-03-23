from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime


class RecruiterBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    agency_name: str | None = None
    notes: str | None = None


class RecruiterCreate(RecruiterBase):
    pass


class RecruiterUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    agency_name: str | None = None
    notes: str | None = None


class RecruiterRead(RecruiterBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
