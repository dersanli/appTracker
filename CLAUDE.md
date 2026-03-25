# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload          # Dev server on :8000
alembic upgrade head                   # Apply migrations
alembic revision --autogenerate -m "description"  # Generate migration
```

### Frontend (React + Vite)
```bash
cd frontend
pnpm install
pnpm dev           # Dev server on :5173
pnpm build         # Production build
pnpm lint          # ESLint
```

## Architecture

Full-stack job application tracker with a React SPA frontend and FastAPI backend, both using Supabase for authentication.

### Authentication Flow
- **Frontend**: Supabase JS client handles login/register. `AuthContext` stores the session and JWT. `lib/api.ts` (Axios instance) automatically attaches `Authorization: Bearer <jwt>` to every request via an interceptor.
- **Backend**: `dependencies.py` verifies JWTs by calling the Supabase REST API. All routes use `get_current_user` dependency to get the authenticated `user_id`, which scopes all DB queries.

### Backend Structure
- `app/main.py` — FastAPI app, CORS, router registration, dashboard aggregate endpoint
- `app/models/` — SQLAlchemy async ORM models (application, client, recruiter, cv, prep_note)
- `app/schemas/` — Pydantic request/response schemas
- `app/routers/` — Route handlers; `applications.py` is the largest (~508 lines) and handles CV/PrepNote attachment
- `app/services/docx_export.py` — Converts markdown content to DOCX for download
- All API routes are prefixed `/api/v1`
- Database uses async SQLAlchemy with asyncpg; sessions injected via `get_db` dependency

### Frontend Structure
- `src/routes/index.tsx` — All routes defined here; `ProtectedRoute` wraps authenticated pages
- `src/contexts/AuthContext.tsx` — Supabase session state; provides user + JWT
- `src/lib/api.ts` — Axios instance pointed at `VITE_API_URL`; auth interceptor
- `src/pages/applications/` — Most complex section; `ApplicationForm.tsx` (~713 lines) handles create/edit, and `ApplicationDetail.tsx` uses tabs (`OverviewTab`, `CVTab`, `DatesTab`, `PrepNotesTab`, `StatusHistoryTab`)
- UI components are Shadcn/ui (Radix UI + Tailwind), configured via `components.json`

### Data Model
Applications are the central entity. Each application can have:
- A `Client` (company) and `Recruiter`
- Multiple `ApplicationCV` records (linked from `CVLibrary`)
- Multiple `ApplicationPrepNote` records (linked from `PrepNotesLibrary`)
- Multiple `ImportantDate` entries (interviews, calls, etc.)
- `ApplicationStatusHistory` audit trail

### Environment Setup
**Backend** — copy `backend/.env.example` to `backend/.env`:
- `DATABASE_URL` — PostgreSQL with asyncpg driver (`postgresql+asyncpg://...`)
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY`

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL=http://localhost:8000/api/v1`
