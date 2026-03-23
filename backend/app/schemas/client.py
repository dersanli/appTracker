from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class ClientBase(BaseModel):
    company_name: str
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    notes: str | None = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    company_name: str | None = None
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    notes: str | None = None


class ClientRead(ClientBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
