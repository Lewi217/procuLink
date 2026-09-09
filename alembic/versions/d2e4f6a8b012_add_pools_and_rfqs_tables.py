"""add pools and rfqs tables

Revision ID: d2e4f6a8b012
Revises: c1f3a2d9e845
Create Date: 2026-09-08 13:14:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'd2e4f6a8b012'
down_revision: Union[str, None] = 'c1f3a2d9e845'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Enum types ---
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE pool_status_enum AS ENUM ('OPEN', 'LOCKED', 'EXPIRED', 'FULFILLED');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE input_channel_enum AS ENUM ('APP_TEXT', 'APP_VOICE', 'USSD', 'SMS');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE rfq_status_enum AS ENUM ('PARSED', 'POOLING', 'LOCKED', 'CANCELLED', 'FULFILLED');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # --- pools table (must be before rfqs due to FK) ---
    op.execute("""
        CREATE TABLE IF NOT EXISTS pools (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            catalog_item_id     UUID NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
            supplier_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            total_quantity      INTEGER NOT NULL DEFAULT 0,
            threshold_quantity  INTEGER NOT NULL,
            status              pool_status_enum NOT NULL DEFAULT 'OPEN',
            locked_at           TIMESTAMPTZ,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_pools_catalog_item_id ON pools (catalog_item_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_pools_supplier_id ON pools (supplier_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_pools_status ON pools (status)")

    # --- rfqs table ---
    op.execute("""
        CREATE TABLE IF NOT EXISTS rfqs (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            manufacturer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            catalog_item_id     UUID REFERENCES catalog_items(id) ON DELETE SET NULL,
            pool_id             UUID REFERENCES pools(id) ON DELETE SET NULL,
            raw_text            TEXT NOT NULL,
            input_channel       input_channel_enum NOT NULL DEFAULT 'APP_TEXT',
            parsed_material     VARCHAR(255),
            parsed_quantity     INTEGER,
            parsed_unit         VARCHAR(50),
            parsed_notes        TEXT,
            parse_confidence    FLOAT,
            status              rfq_status_enum NOT NULL DEFAULT 'PARSED',
            client_generated_id UUID UNIQUE,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_rfqs_manufacturer_id ON rfqs (manufacturer_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_rfqs_catalog_item_id ON rfqs (catalog_item_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_rfqs_pool_id ON rfqs (pool_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_rfqs_status ON rfqs (status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_rfqs_client_generated_id ON rfqs (client_generated_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS rfqs")
    op.execute("DROP TABLE IF EXISTS pools")
    op.execute("DROP TYPE IF EXISTS rfq_status_enum")
    op.execute("DROP TYPE IF EXISTS input_channel_enum")
    op.execute("DROP TYPE IF EXISTS pool_status_enum")
