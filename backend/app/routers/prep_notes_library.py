from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.prep_note import PrepNotesLibrary
from app.schemas.prep_note import (
    PrepNotesLibraryCreate,
    PrepNotesLibraryUpdate,
    PrepNotesLibraryRead,
)

router = APIRouter(prefix="/prep-notes-library", tags=["prep-notes-library"])


@router.get("", response_model=list[PrepNotesLibraryRead])
async def list_prep_notes(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(PrepNotesLibrary)
        .where(PrepNotesLibrary.user_id == user_id)
        .order_by(PrepNotesLibrary.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=PrepNotesLibraryRead, status_code=status.HTTP_201_CREATED)
async def create_prep_note(
    payload: PrepNotesLibraryCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    note = PrepNotesLibrary(**payload.model_dump(), user_id=user_id)
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return note


@router.get("/{note_id}", response_model=PrepNotesLibraryRead)
async def get_prep_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return await _get_owned_note(db, note_id, user_id)


@router.put("/{note_id}", response_model=PrepNotesLibraryRead)
async def update_prep_note(
    note_id: UUID,
    payload: PrepNotesLibraryUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    note = await _get_owned_note(db, note_id, user_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    await db.flush()
    await db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prep_note(
    note_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    note = await _get_owned_note(db, note_id, user_id)
    await db.delete(note)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_owned_note(db: AsyncSession, note_id: UUID, user_id: str) -> PrepNotesLibrary:
    result = await db.execute(select(PrepNotesLibrary).where(PrepNotesLibrary.id == note_id))
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prep note not found.")
    if str(note.user_id) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return note
