import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, DateTime, Enum, Integer, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class PoolStatus(str, PyEnum):
    OPEN = "OPEN"
    LOCKED = "LOCKED"
    EXPIRED = "EXPIRED"
    FULFILLED = "FULFILLED"


class Pool(Base):
    __tablename__ = "pools"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    catalog_item_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalog_items.id", ondelete="CASCADE"), nullable=False, index=True
    )
    supplier_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    total_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    threshold_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PoolStatus] = mapped_column(
        Enum(PoolStatus, name="pool_status_enum", create_type=False), nullable=False, default=PoolStatus.OPEN
    )
    locked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    catalog_item = relationship("CatalogItem", foreign_keys=[catalog_item_id], lazy="noload")
    supplier = relationship("User", foreign_keys=[supplier_id], lazy="noload")
    rfqs = relationship("RFQ", back_populates="pool", lazy="noload")
