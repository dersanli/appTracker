from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


# ── CV Library ────────────────────────────────────────────────────────────────

class CVLibraryBase(BaseModel):
    name: str
    content: str = ""


class CVLibraryCreate(CVLibraryBase):
    pass


class CVLibraryUpdate(BaseModel):
    name: str | None = None
    content: str | None = None


class CVLibraryRead(CVLibraryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Application CV ────────────────────────────────────────────────────────────

class ApplicationCVCreate(BaseModel):
    name: str
    content: str = ""
    source_cv_id: UUID | None = None


class ApplicationCVUpdate(BaseModel):
    name: str | None = None
    content: str | None = None


class ApplicationCVRead(BaseModel):
    id: UUID
    application_id: UUID
    name: str
    content: str
    source_cv_id: UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
