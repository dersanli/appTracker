from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.cv import CVLibrary
from app.schemas.cv import CVLibraryCreate, CVLibraryUpdate, CVLibraryRead

router = APIRouter(prefix="/cv-library", tags=["cv-library"])


@router.get("", response_model=list[CVLibraryRead])
async def list_cvs(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    result = await db.execute(
        select(CVLibrary)
        .where(CVLibrary.user_id == user_id)
        .order_by(CVLibrary.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=CVLibraryRead, status_code=status.HTTP_201_CREATED)
async def create_cv(
    payload: CVLibraryCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    cv = CVLibrary(**payload.model_dump(), user_id=user_id)
    db.add(cv)
    await db.flush()
    await db.refresh(cv)
    return cv


@router.get("/{cv_id}", response_model=CVLibraryRead)
async def get_cv(
    cv_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    return await _get_owned_cv(db, cv_id, user_id)


@router.put("/{cv_id}", response_model=CVLibraryRead)
async def update_cv(
    cv_id: UUID,
    payload: CVLibraryUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    cv = await _get_owned_cv(db, cv_id, user_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cv, field, value)
    await db.flush()
    await db.refresh(cv)
    return cv


@router.delete("/{cv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cv(
    cv_id: UUID,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    cv = await _get_owned_cv(db, cv_id, user_id)
    await db.delete(cv)


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_owned_cv(db: AsyncSession, cv_id: UUID, user_id: str) -> CVLibrary:
    result = await db.execute(select(CVLibrary).where(CVLibrary.id == cv_id))
    cv = result.scalar_one_or_none()
    if cv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CV not found.")
    if str(cv.user_id) != str(user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return cv
