import uuid
from decimal import Decimal
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Boolean, DateTime, Enum, Integer, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class CatalogCategory(str, PyEnum):
    METAL = "METAL"
    TIMBER = "TIMBER"
    PACKAGING = "PACKAGING"
    CHEMICAL = "CHEMICAL"
    OTHER = "OTHER"


class CatalogUnit(str, PyEnum):
    SHEET = "SHEET"
    PIECE = "PIECE"
    KG = "KG"
    BAG = "BAG"
    METER = "METER"
    LITRE = "LITRE"


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[CatalogCategory] = mapped_column(
        Enum(CatalogCategory, name="catalog_category_enum", create_type=False), nullable=False, index=True
    )
    unit: Mapped[CatalogUnit] = mapped_column(
        Enum(CatalogUnit, name="catalog_unit_enum", create_type=False), nullable=False
    )
    retail_price_per_unit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    bulk_price_per_unit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    bulk_threshold_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationship back to supplier
    supplier = relationship("User", foreign_keys=[supplier_id], lazy="noload")
