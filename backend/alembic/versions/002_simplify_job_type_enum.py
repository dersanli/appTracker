"""simplify job_type enum

Revision ID: 002
Revises: 001
Create Date: 2026-03-20 00:00:00.000000
"""

from alembic import op

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Migrate any rows using removed values to the closest equivalent
    op.execute("""
        UPDATE applications
        SET job_type = 'inside_ir35'
        WHERE job_type = 'contract'
    """)
    op.execute("""
        UPDATE applications
        SET job_type = 'permanent'
        WHERE job_type IN ('full_time', 'part_time')
    """)

    # Replace the enum type (PostgreSQL doesn't support removing enum values directly)
    op.execute("ALTER TYPE job_type RENAME TO job_type_old")
    op.execute("CREATE TYPE job_type AS ENUM ('permanent', 'inside_ir35', 'outside_ir35')")
    op.execute("""
        ALTER TABLE applications
        ALTER COLUMN job_type TYPE job_type
        USING job_type::text::job_type
    """)
    op.execute("DROP TYPE job_type_old")


def downgrade() -> None:
    op.execute("ALTER TYPE job_type RENAME TO job_type_old")
    op.execute("""
        CREATE TYPE job_type AS ENUM (
            'contract', 'inside_ir35', 'outside_ir35',
            'permanent', 'full_time', 'part_time'
        )
    """)
    op.execute("""
        ALTER TABLE applications
        ALTER COLUMN job_type TYPE job_type
        USING job_type::text::job_type
    """)
    op.execute("DROP TYPE job_type_old")
