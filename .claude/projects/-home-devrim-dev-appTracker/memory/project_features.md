---
name: Completed features and UI patterns
description: Summary of features built and key UI/UX patterns established in the app
type: project
---

Features implemented and stable as of 2026-04-08:

- **PrepNotesTab**: two-pane layout — list of notes on the left, selected note content on the right. Read/edit toggle (same pattern as CVTab). Add dialog, Copy from Library, delete in read mode.
- **CVTab**: read/edit toggle — defaults to `MDEditor.Markdown` rendered view; Edit button switches to full `MDEditor`. Save returns to read mode; Cancel restores last saved content.
- **Tab icons**: ApplicationDetail tabs use lucide-react icons (LayoutDashboard, FileText, BookOpen, CalendarDays, History).
- **Application detail subtitle**: shows `Company — Recruiter`, either alone, or nothing if neither set.
- **Document titles**: `useDocumentTitle` hook at `src/hooks/useDocumentTitle.ts` sets `AppTracker | {page}` across all pages. Dynamic pages use loaded data (e.g. application role, recruiter name).
- **Copy from Library**: CVTab and PrepNotesTab both have dialogs to copy content from their respective library items.
- **Status history**: recorded automatically on PUT when status changes.
- **Recruiter/client in overview**: backend returns nested objects via `selectinload`; OverviewTab is read-only.

**UI pattern**: tabs with content (CV, PrepNotes) follow read-by-default with an Edit button — not inline editors on load.

**How to apply:** Check this list before adding features to avoid duplicating existing behaviour or breaking established patterns.
