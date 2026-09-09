"""rename buyer to manufacturer and add catalog items table

Revision ID: c1f3a2d9e845
Revises: b0e876f8aa93
Create Date: 2026-09-08 11:24:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c1f3a2d9e845'
down_revision: Union[str, None] = 'b0e876f8aa93'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # -----------------------------------------------------------------------
    # 1. Rename BUYER → MANUFACTURER in the existing enum type.
    # PostgreSQL 10+ ALTER TYPE ... RENAME VALUE also updates all column
    # values that reference the old label automatically.
    # -----------------------------------------------------------------------
    op.execute("ALTER TYPE user_role_enum RENAME VALUE 'BUYER' TO 'MANUFACTURER'")

    # -----------------------------------------------------------------------
    # 2. Ensure catalog enum types exist (idempotent via EXCEPTION handler).
    # -----------------------------------------------------------------------
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE catalog_category_enum AS ENUM (
                'METAL', 'TIMBER', 'PACKAGING', 'CHEMICAL', 'OTHER'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE catalog_unit_enum AS ENUM (
                'SHEET', 'PIECE', 'KG', 'BAG', 'METER', 'LITRE'
            );
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # -----------------------------------------------------------------------
    # 3. Create catalog_items table using raw SQL to avoid SQLAlchemy's
    #    automatic CREATE TYPE DDL on the Enum columns.
    # -----------------------------------------------------------------------
    op.execute("""
        CREATE TABLE IF NOT EXISTS catalog_items (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            supplier_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name            VARCHAR(255) NOT NULL,
            category        catalog_category_enum NOT NULL,
            unit            catalog_unit_enum NOT NULL,
            retail_price_per_unit  NUMERIC(12, 2) NOT NULL,
            bulk_price_per_unit    NUMERIC(12, 2) NOT NULL,
            bulk_threshold_quantity INTEGER NOT NULL,
            stock_quantity  INTEGER NOT NULL DEFAULT 0,
            is_active       BOOLEAN NOT NULL DEFAULT TRUE,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_catalog_items_supplier_id ON catalog_items (supplier_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_catalog_items_name ON catalog_items (name)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_catalog_items_category ON catalog_items (category)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS catalog_items")
    op.execute("DROP TYPE IF EXISTS catalog_unit_enum")
    op.execute("DROP TYPE IF EXISTS catalog_category_enum")
    op.execute("ALTER TYPE user_role_enum RENAME VALUE 'MANUFACTURER' TO 'BUYER'")
