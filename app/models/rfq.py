import uuid
from datetime import datetime
from enum import Enum as PyEnum
from typing import Optional

from sqlalchemy import String, Text, DateTime, Enum, Integer, Float, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class InputChannel(str, PyEnum):
    APP_TEXT = "APP_TEXT"
    APP_VOICE = "APP_VOICE"
    USSD = "USSD"
    SMS = "SMS"


class RFQStatus(str, PyEnum):
    PARSED = "PARSED"
    POOLING = "POOLING"
    LOCKED = "LOCKED"
    CANCELLED = "CANCELLED"
    FULFILLED = "FULFILLED"


class RFQ(Base):
    __tablename__ = "rfqs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    manufacturer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    catalog_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("catalog_items.id", ondelete="SET NULL"), nullable=True, index=True
    )
    pool_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pools.id", ondelete="SET NULL"), nullable=True, index=True
    )
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    input_channel: Mapped[InputChannel] = mapped_column(
        Enum(InputChannel, name="input_channel_enum", create_type=False), nullable=False, default=InputChannel.APP_TEXT
    )
    parsed_material: Mapped[str | None] = mapped_column(String(255), nullable=True)
    parsed_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    parsed_unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    parsed_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    parse_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[RFQStatus] = mapped_column(
        Enum(RFQStatus, name="rfq_status_enum", create_type=False), nullable=False, default=RFQStatus.PARSED
    )
    client_generated_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, unique=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    manufacturer = relationship("User", foreign_keys=[manufacturer_id], lazy="noload")
    catalog_item = relationship("CatalogItem", foreign_keys=[catalog_item_id], lazy="noload")
    pool = relationship("Pool", foreign_keys=[pool_id], back_populates="rfqs", lazy="noload")
