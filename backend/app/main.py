from datetime import datetime, timezone, timedelta

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.application import (
    Application,
    ApplicationStatus,
    ApplicationStatusHistory,
    ImportantDate,
)
from app.routers import applications, recruiters, clients, cv_library, prep_notes_library

app = FastAPI(
    title="Job Application Tracker API",
    version="1.0.0",
    description="Backend API for tracking job applications.",
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(applications.router, prefix=API_PREFIX)
app.include_router(recruiters.router, prefix=API_PREFIX)
app.include_router(clients.router, prefix=API_PREFIX)
app.include_router(cv_library.router, prefix=API_PREFIX)
app.include_router(prep_notes_library.router, prefix=API_PREFIX)


# ── Dashboard ─────────────────────────────────────────────────────────────────

class StatusBreakdown(BaseModel):
    status: ApplicationStatus
    count: int


class UpcomingDate(BaseModel):
    id: str
    application_id: str
    application_role: str
    title: str
    date: datetime
    type: str
    notes: str | None = None


class RecentActivity(BaseModel):
    id: str
    application_id: str
    application_role: str
    status: ApplicationStatus
    notes: str | None = None
    changed_at: datetime


class DashboardResponse(BaseModel):
    total_applications: int
    status_breakdown: list[StatusBreakdown]
    upcoming_dates: list[UpcomingDate]
    recent_activity: list[RecentActivity]


@app.get(f"{API_PREFIX}/dashboard", response_model=DashboardResponse, tags=["dashboard"])
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user),
):
    # ── Status counts ─────────────────────────────────────────────────────────
    status_counts_result = await db.execute(
        select(Application.current_status, func.count(Application.id).label("count"))
        .where(Application.user_id == user_id)
        .group_by(Application.current_status)
    )
    status_breakdown_rows = status_counts_result.all()
    status_breakdown = [
        StatusBreakdown(status=row.current_status, count=row.count)
        for row in status_breakdown_rows
    ]
    total_applications = sum(r.count for r in status_breakdown_rows)

    # ── Upcoming dates (next 14 days) ─────────────────────────────────────────
    now = datetime.now(timezone.utc)
    two_weeks = now + timedelta(days=14)

    upcoming_result = await db.execute(
        select(ImportantDate, Application.role)
        .join(Application, ImportantDate.application_id == Application.id)
        .where(
            Application.user_id == user_id,
            ImportantDate.date >= now,
            ImportantDate.date <= two_weeks,
        )
        .order_by(ImportantDate.date.asc())
    )
    upcoming_dates = [
        UpcomingDate(
            id=str(row.ImportantDate.id),
            application_id=str(row.ImportantDate.application_id),
            application_role=row.role,
            title=row.ImportantDate.title,
            date=row.ImportantDate.date,
            type=row.ImportantDate.type.value,
            notes=row.ImportantDate.notes,
        )
        for row in upcoming_result.all()
    ]

    # ── Recent activity (last 5 status history entries) ───────────────────────
    recent_result = await db.execute(
        select(ApplicationStatusHistory, Application.role)
        .join(Application, ApplicationStatusHistory.application_id == Application.id)
        .where(Application.user_id == user_id)
        .order_by(ApplicationStatusHistory.changed_at.desc())
        .limit(5)
    )
    recent_activity = [
        RecentActivity(
            id=str(row.ApplicationStatusHistory.id),
            application_id=str(row.ApplicationStatusHistory.application_id),
            application_role=row.role,
            status=row.ApplicationStatusHistory.status,
            notes=row.ApplicationStatusHistory.notes,
            changed_at=row.ApplicationStatusHistory.changed_at,
        )
        for row in recent_result.all()
    ]

    return DashboardResponse(
        total_applications=total_applications,
        status_breakdown=status_breakdown,
        upcoming_dates=upcoming_dates,
        recent_activity=recent_activity,
    )


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
