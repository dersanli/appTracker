"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-19 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Enums ─────────────────────────────────────────────────────────────────
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE job_type AS ENUM ('contract','inside_ir35','outside_ir35','permanent','full_time','part_time');
        EXCEPTION WHEN duplicate_object THEN null; END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE work_arrangement AS ENUM ('remote','hybrid');
        EXCEPTION WHEN duplicate_object THEN null; END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE salary_type AS ENUM ('daily_rate','annual');
        EXCEPTION WHEN duplicate_object THEN null; END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE application_status AS ENUM ('applied','recruiter_chat','interview','offer','offer_accepted','offer_rejected','rejected','withdrawn');
        EXCEPTION WHEN duplicate_object THEN null; END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE date_type AS ENUM ('recruiter_call','interview','other');
        EXCEPTION WHEN duplicate_object THEN null; END $$
    """)

    # ── recruiters ────────────────────────────────────────────────────────────
    op.create_table(
        "recruiters",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("email", sa.Text, nullable=True),
        sa.Column("phone", sa.Text, nullable=True),
        sa.Column("agency_name", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_recruiters_user_id", "recruiters", ["user_id"])

    # ── clients ───────────────────────────────────────────────────────────────
    op.create_table(
        "clients",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company_name", sa.Text, nullable=False),
        sa.Column("contact_name", sa.Text, nullable=True),
        sa.Column("email", sa.Text, nullable=True),
        sa.Column("phone", sa.Text, nullable=True),
        sa.Column("website", sa.Text, nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_clients_user_id", "clients", ["user_id"])

    # ── applications ──────────────────────────────────────────────────────────
    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("role", sa.Text, nullable=False),
        sa.Column("job_description", sa.Text, nullable=True),
        sa.Column(
            "client_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("clients.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "recruiter_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("recruiters.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("job_type", postgresql.ENUM(name="job_type", create_type=False), nullable=True),
        sa.Column("work_arrangement", postgresql.ENUM(name="work_arrangement", create_type=False), nullable=True),
        sa.Column("hybrid_days_per_week", sa.Integer, nullable=True),
        sa.Column("salary_type", postgresql.ENUM(name="salary_type", create_type=False), nullable=True),
        sa.Column("salary_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column(
            "current_status",
            postgresql.ENUM(name="application_status", create_type=False),
            nullable=False,
            server_default="applied",
        ),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_applications_user_id", "applications", ["user_id"])

    # ── application_status_history ────────────────────────────────────────────
    op.create_table(
        "application_status_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", postgresql.ENUM(name="application_status", create_type=False), nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "changed_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_application_status_history_application_id",
        "application_status_history",
        ["application_id"],
    )

    # ── important_dates ───────────────────────────────────────────────────────
    op.create_table(
        "important_dates",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status_history_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("application_status_history.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("type", postgresql.ENUM(name="date_type", create_type=False), nullable=False),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_important_dates_application_id",
        "important_dates",
        ["application_id"],
    )

    # ── cv_library ────────────────────────────────────────────────────────────
    op.create_table(
        "cv_library",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("content", sa.Text, nullable=False, server_default=""),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_cv_library_user_id", "cv_library", ["user_id"])

    # ── application_cvs ───────────────────────────────────────────────────────
    op.create_table(
        "application_cvs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("content", sa.Text, nullable=False, server_default=""),
        sa.Column(
            "source_cv_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("cv_library.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_application_cvs_application_id",
        "application_cvs",
        ["application_id"],
    )

    # ── prep_notes_library ────────────────────────────────────────────────────
    op.create_table(
        "prep_notes_library",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("content", sa.Text, nullable=False, server_default=""),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_prep_notes_library_user_id",
        "prep_notes_library",
        ["user_id"],
    )

    # ── application_prep_notes ────────────────────────────────────────────────
    op.create_table(
        "application_prep_notes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("applications.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("content", sa.Text, nullable=False, server_default=""),
        sa.Column(
            "source_note_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("prep_notes_library.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_application_prep_notes_application_id",
        "application_prep_notes",
        ["application_id"],
    )


def downgrade() -> None:
    op.drop_table("application_prep_notes")
    op.drop_table("prep_notes_library")
    op.drop_table("application_cvs")
    op.drop_table("cv_library")
    op.drop_table("important_dates")
    op.drop_table("application_status_history")
    op.drop_table("applications")
    op.drop_table("clients")
    op.drop_table("recruiters")

    op.execute("DROP TYPE IF EXISTS date_type")
    op.execute("DROP TYPE IF EXISTS application_status")
    op.execute("DROP TYPE IF EXISTS salary_type")
    op.execute("DROP TYPE IF EXISTS work_arrangement")
    op.execute("DROP TYPE IF EXISTS job_type")
