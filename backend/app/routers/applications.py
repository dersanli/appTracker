from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import (
    Application,
    ApplicationStatus,
    ApplicationStatusHistory,
    DateType,
    ImportantDate,
    JobType,
    WorkArrangement,
)
from app.models.cv import ApplicationCV, CVLibrary
from app.models.prep_note import ApplicationPrepNote, PrepNotesLibrary
from app.schemas.application import (
    ApplicationCreate,
    ApplicationRead,
    ApplicationUpdate,
    ImportantDateCreate,
    ImportantDateRead,
    ImportantDateUpdate,
    StatusHistoryCreate,
    StatusHistoryRead,
)
from app.schemas.cv import ApplicationCVCreate, ApplicationCVRead, ApplicationCVUpdate
from app.schemas.prep_note import (
    ApplicationPrepNoteCreate,
    ApplicationPrepNoteRead,
    ApplicationPrepNoteUpdate,
)
from app.services.docx_export import markdown_to_docx

router = APIRouter(prefix="/applications", tags=["applications"])


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_owned_application(
    db: AsyncSession, application_id: UUID, user_id: str
) -> Application:
    result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    app = result.scalar_one_or_none()
    if app is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    if str(app.user_id) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return app


# ── Applications CRUD ─────────────────────────────────────────────────────────

@router.get("", response_model=list[ApplicationRead])
async def list_applications(
    application_status: ApplicationStatus | None = Query(None, alias="status"),
    job_type: JobType | None = Query(None),
    work_arrangement: WorkArrangement | None = Query(None),
    client_id: UUID | None = Query(None),
    recruiter_id: UUID | None = Query(None),
    sort_by: Literal["created_at", "salary_amount", "role"] = Query("created_at"),
    sort_order: Literal["asc", "desc"] = Query("desc"),
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    q = select(Application).where(Application.user_id == user_id)

    if application_status is not None:
        q = q.where(Application.current_status == application_status)
    if job_type is not None:
        q = q.where(Application.job_type == job_type)
    if work_arrangement is not None:
        q = q.where(Application.work_arrangement == work_arrangement)
    if client_id is not None:
        q = q.where(Application.client_id == client_id)
    if recruiter_id is not None:
        q = q.where(Application.recruiter_id == recruiter_id)

    sort_col = getattr(Application, sort_by)
    q = q.order_by(sort_col.asc() if sort_order == "asc" else sort_col.desc())

    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    app = Application(**payload.model_dump(), user_id=user_id)
    db.add(app)
    await db.flush()

    # Record the initial status in history
    history_entry = ApplicationStatusHistory(
        application_id=app.id,
        status=app.current_status,
        notes="Initial status",
        changed_at=app.created_at,
    )
    db.add(history_entry)
    await db.flush()
    await db.refresh(app)
    return app


@router.get("/{application_id}", response_model=ApplicationRead)
async def get_application(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return await _get_owned_application(db, application_id, user_id)


@router.put("/{application_id}", response_model=ApplicationRead)
async def update_application(
    application_id: UUID,
    payload: ApplicationUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    app = await _get_owned_application(db, application_id, user_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    await db.flush()
    await db.refresh(app)
    return app


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    app = await _get_owned_application(db, application_id, user_id)
    await db.delete(app)


# ── Status history ────────────────────────────────────────────────────────────

@router.post(
    "/{application_id}/status",
    response_model=StatusHistoryRead,
    status_code=status.HTTP_201_CREATED,
)
async def add_status(
    application_id: UUID,
    payload: StatusHistoryCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    app = await _get_owned_application(db, application_id, user_id)
    app.current_status = payload.status

    changed_at = payload.changed_at or datetime.now(timezone.utc)
    history_entry = ApplicationStatusHistory(
        application_id=application_id,
        status=payload.status,
        notes=payload.notes,
        changed_at=changed_at,
    )
    db.add(history_entry)
    await db.flush()
    await db.refresh(history_entry)
    return history_entry


@router.get(
    "/{application_id}/status/history",
    response_model=list[StatusHistoryRead],
)
async def get_status_history(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    result = await db.execute(
        select(ApplicationStatusHistory)
        .where(ApplicationStatusHistory.application_id == application_id)
        .order_by(ApplicationStatusHistory.changed_at.asc())
    )
    return result.scalars().all()


# ── Important dates ───────────────────────────────────────────────────────────

@router.get("/{application_id}/dates", response_model=list[ImportantDateRead])
async def list_dates(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    result = await db.execute(
        select(ImportantDate)
        .where(ImportantDate.application_id == application_id)
        .order_by(ImportantDate.date.asc())
    )
    return result.scalars().all()


@router.post(
    "/{application_id}/dates",
    response_model=ImportantDateRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_date(
    application_id: UUID,
    payload: ImportantDateCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    date_obj = ImportantDate(**payload.model_dump(), application_id=application_id)
    db.add(date_obj)
    await db.flush()
    await db.refresh(date_obj)
    return date_obj


@router.put("/{application_id}/dates/{date_id}", response_model=ImportantDateRead)
async def update_date(
    application_id: UUID,
    date_id: UUID,
    payload: ImportantDateUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    date_obj = await _get_date(db, date_id, application_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(date_obj, field, value)
    await db.flush()
    await db.refresh(date_obj)
    return date_obj


@router.delete("/{application_id}/dates/{date_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_date(
    application_id: UUID,
    date_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    date_obj = await _get_date(db, date_id, application_id)
    await db.delete(date_obj)


async def _get_date(db: AsyncSession, date_id: UUID, application_id: UUID) -> ImportantDate:
    result = await db.execute(
        select(ImportantDate).where(
            ImportantDate.id == date_id,
            ImportantDate.application_id == application_id,
        )
    )
    date_obj = result.scalar_one_or_none()
    if date_obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Date not found.")
    return date_obj


# ── Application CV ────────────────────────────────────────────────────────────

@router.get("/{application_id}/cv", response_model=ApplicationCVRead)
async def get_application_cv(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    cv = await _get_cv(db, application_id)
    if cv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found for this application.")
    return cv


@router.post(
    "/{application_id}/cv",
    response_model=ApplicationCVRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_application_cv(
    application_id: UUID,
    payload: ApplicationCVCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)

    existing = await _get_cv(db, application_id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A CV already exists for this application. Use PUT to update it.",
        )

    content = payload.content

    # If source_cv_id provided, copy content from the library
    if payload.source_cv_id is not None:
        source_result = await db.execute(
            select(CVLibrary).where(
                CVLibrary.id == payload.source_cv_id,
                CVLibrary.user_id == user_id,
            )
        )
        source = source_result.scalar_one_or_none()
        if source is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source CV not found in library.",
            )
        content = source.content

    cv = ApplicationCV(
        application_id=application_id,
        name=payload.name,
        content=content,
        source_cv_id=payload.source_cv_id,
    )
    db.add(cv)
    await db.flush()
    await db.refresh(cv)
    return cv


@router.put("/{application_id}/cv", response_model=ApplicationCVRead)
async def update_application_cv(
    application_id: UUID,
    payload: ApplicationCVUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    cv = await _get_cv(db, application_id)
    if cv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found for this application.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cv, field, value)
    await db.flush()
    await db.refresh(cv)
    return cv


@router.delete("/{application_id}/cv", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application_cv(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    cv = await _get_cv(db, application_id)
    if cv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found for this application.")
    await db.delete(cv)


@router.get("/{application_id}/cv/export")
async def export_application_cv(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    app = await _get_owned_application(db, application_id, user_id)
    cv = await _get_cv(db, application_id)
    if cv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found for this application.")

    buffer = markdown_to_docx(cv.content)
    filename = f"{cv.name.replace(' ', '_')}.docx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _get_cv(db: AsyncSession, application_id: UUID) -> ApplicationCV | None:
    result = await db.execute(
        select(ApplicationCV).where(ApplicationCV.application_id == application_id)
    )
    return result.scalar_one_or_none()


# ── Application Prep Notes ────────────────────────────────────────────────────

@router.get("/{application_id}/prep-notes", response_model=list[ApplicationPrepNoteRead])
async def list_prep_notes(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    result = await db.execute(
        select(ApplicationPrepNote)
        .where(ApplicationPrepNote.application_id == application_id)
        .order_by(ApplicationPrepNote.created_at.asc())
    )
    return result.scalars().all()


@router.post(
    "/{application_id}/prep-notes",
    response_model=ApplicationPrepNoteRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_prep_note(
    application_id: UUID,
    payload: ApplicationPrepNoteCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)

    content = payload.content

    # If source_note_id provided, copy content from the library
    if payload.source_note_id is not None:
        source_result = await db.execute(
            select(PrepNotesLibrary).where(
                PrepNotesLibrary.id == payload.source_note_id,
                PrepNotesLibrary.user_id == user_id,
            )
        )
        source = source_result.scalar_one_or_none()
        if source is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Source prep note not found in library.",
            )
        content = source.content

    note = ApplicationPrepNote(
        application_id=application_id,
        name=payload.name,
        content=content,
        source_note_id=payload.source_note_id,
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return note


@router.put(
    "/{application_id}/prep-notes/{note_id}",
    response_model=ApplicationPrepNoteRead,
)
async def update_prep_note(
    application_id: UUID,
    note_id: UUID,
    payload: ApplicationPrepNoteUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    note = await _get_prep_note(db, note_id, application_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    await db.flush()
    await db.refresh(note)
    return note


@router.delete(
    "/{application_id}/prep-notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_prep_note(
    application_id: UUID,
    note_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    await _get_owned_application(db, application_id, user_id)
    note = await _get_prep_note(db, note_id, application_id)
    await db.delete(note)


async def _get_prep_note(
    db: AsyncSession, note_id: UUID, application_id: UUID
) -> ApplicationPrepNote:
    result = await db.execute(
        select(ApplicationPrepNote).where(
            ApplicationPrepNote.id == note_id,
            ApplicationPrepNote.application_id == application_id,
        )
    )
    note = result.scalar_one_or_none()
    if note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prep note not found.")
    return note
