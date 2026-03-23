from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


# ── Prep Notes Library ────────────────────────────────────────────────────────

class PrepNotesLibraryBase(BaseModel):
    name: str
    content: str = ""


class PrepNotesLibraryCreate(PrepNotesLibraryBase):
    pass


class PrepNotesLibraryUpdate(BaseModel):
    name: str | None = None
    content: str | None = None


class PrepNotesLibraryRead(PrepNotesLibraryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Application Prep Notes ────────────────────────────────────────────────────

class ApplicationPrepNoteCreate(BaseModel):
    name: str
    content: str = ""
    source_note_id: UUID | None = None


class ApplicationPrepNoteUpdate(BaseModel):
    name: str | None = None
    content: str | None = None


class ApplicationPrepNoteRead(BaseModel):
    id: UUID
    application_id: UUID
    name: str
    content: str
    source_note_id: UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
