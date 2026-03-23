from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.recruiter import Recruiter
from app.models.application import Application
from app.schemas.recruiter import RecruiterCreate, RecruiterUpdate, RecruiterRead

router = APIRouter(prefix="/recruiters", tags=["recruiters"])


@router.get("", response_model=list[RecruiterRead])
async def list_recruiters(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(Recruiter)
        .where(Recruiter.user_id == user_id)
        .order_by(Recruiter.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=RecruiterRead, status_code=status.HTTP_201_CREATED)
async def create_recruiter(
    payload: RecruiterCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    recruiter = Recruiter(**payload.model_dump(), user_id=user_id)
    db.add(recruiter)
    await db.flush()
    await db.refresh(recruiter)
    return recruiter


@router.get("/{recruiter_id}", response_model=RecruiterRead)
async def get_recruiter(
    recruiter_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    recruiter = await _get_owned_recruiter(db, recruiter_id, user_id)
    return recruiter


@router.put("/{recruiter_id}", response_model=RecruiterRead)
async def update_recruiter(
    recruiter_id: UUID,
    payload: RecruiterUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    recruiter = await _get_owned_recruiter(db, recruiter_id, user_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(recruiter, field, value)
    await db.flush()
    await db.refresh(recruiter)
    return recruiter


@router.delete("/{recruiter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recruiter(
    recruiter_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    recruiter = await _get_owned_recruiter(db, recruiter_id, user_id)

    # Block delete if linked to applications
    count_result = await db.execute(
        select(func.count()).where(Application.recruiter_id == recruiter_id)
    )
    if count_result.scalar_one() > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete recruiter: linked to one or more applications.",
        )

    await db.delete(recruiter)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_owned_recruiter(db: AsyncSession, recruiter_id: UUID, user_id: str) -> Recruiter:
    result = await db.execute(
        select(Recruiter).where(Recruiter.id == recruiter_id)
    )
    recruiter = result.scalar_one_or_none()
    if recruiter is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found.")
    if str(recruiter.user_id) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return recruiter
