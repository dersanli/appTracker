import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class PrepNotesLibrary(Base):
    __tablename__ = "prep_notes_library"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(Text, nullable=False)
    content = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    application_prep_notes = relationship(
        "ApplicationPrepNote",
        back_populates="source_note",
        lazy="noload",
    )


class ApplicationPrepNote(Base):
    __tablename__ = "application_prep_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(
        UUID(as_uuid=True),
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(Text, nullable=False)
    content = Column(Text, nullable=False, default="")
    source_note_id = Column(
        UUID(as_uuid=True),
        ForeignKey("prep_notes_library.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    application = relationship("Application", back_populates="prep_notes", lazy="noload")
    source_note = relationship("PrepNotesLibrary", back_populates="application_prep_notes", lazy="noload")
