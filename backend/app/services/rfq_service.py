import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rfq import RFQ, RFQStatus
from app.models.user import User
from app.repositories import rfq_repository, pool_repository, catalog_repository
from app.schemas.rfq import RFQCreate, RFQUpdate
from app.utils.exceptions import NotFoundError, ForbiddenError, BaseAppException


class PoolLockedError(BaseAppException):
    def __init__(self):
        super().__init__(status_code=409, code="POOL_ALREADY_LOCKED", message="This pool is locked and the RFQ can no longer be modified.")


async def parse_rfq(db: AsyncSession, raw_text: str) -> dict:
    """Calls Azure OpenAI parser — no DB writes."""
    from app.services.ai_parser import parse
    return await parse(db, raw_text)


async def submit_rfq(db: AsyncSession, manufacturer: User, data: RFQCreate) -> RFQ:
    """
    Full RFQ submission flow:
    1. Idempotency check
    2. Validate catalog item
    3. Create RFQ (status=PARSED)
    4. Find or create Pool for catalog item
    5. Add quantity to pool, link pool to RFQ → status=POOLING
    6. Auto-lock pool if threshold reached
    """
    # 1. Idempotency — return existing RFQ if same clientGeneratedId
    if data.client_generated_id:
        existing = await rfq_repository.get_by_client_id(db, data.client_generated_id)
        if existing:
            return existing

    # 2. Validate catalog item exists and is active
    catalog_item = await catalog_repository.get_by_id(db, data.matched_catalog_item_id)
    if not catalog_item or not catalog_item.is_active:
        raise NotFoundError("Catalog item not found or inactive.")

    # 3. Create RFQ
    rfq = await rfq_repository.create(db, {
        "manufacturer_id": manufacturer.id,
        "catalog_item_id": data.matched_catalog_item_id,
        "raw_text": data.raw_text,
        "input_channel": data.input_channel,
        "parsed_material": catalog_item.name,
        "parsed_quantity": data.quantity,
        "parsed_unit": data.unit,
        "parsed_notes": data.notes,
        "status": RFQStatus.PARSED,
        "client_generated_id": data.client_generated_id,
    })

    # 4. Find open pool or create a new one
    pool = await pool_repository.get_open_for_item(db, catalog_item.id)
    if not pool:
        pool = await pool_repository.create(
            db,
            catalog_item_id=catalog_item.id,
            supplier_id=catalog_item.supplier_id,
            threshold_quantity=catalog_item.bulk_threshold_quantity,
        )

    # 5. Add quantity & link RFQ → Pool
    pool = await pool_repository.add_quantity(db, pool, data.quantity)
    rfq = await rfq_repository.update(db, rfq, {
        "pool_id": pool.id,
        "status": RFQStatus.POOLING,
    })

    # 6. Auto-lock if threshold reached
    if pool.total_quantity >= pool.threshold_quantity:
        pool = await pool_repository.lock(db, pool)
        await rfq_repository.lock_all_in_pool(db, pool.id)
        await db.refresh(rfq)

    await db.commit()
    await db.refresh(rfq)
    return rfq


async def get_rfq(db: AsyncSession, rfq_id: str, current_user: User) -> RFQ:
    rfq = await rfq_repository.get_by_id(db, rfq_id)
    if not rfq:
        raise NotFoundError("RFQ not found.")
    if rfq.manufacturer_id != current_user.id and current_user.role.value != "ADMIN":
        raise ForbiddenError("You do not have access to this RFQ.")
    return rfq


async def list_mine(
    db: AsyncSession,
    manufacturer: User,
    status: Optional[str],
    page: int,
    page_size: int,
) -> tuple[list[RFQ], int]:
    return await rfq_repository.get_mine(db, manufacturer.id, status, page, page_size)


async def update_rfq(db: AsyncSession, rfq_id: str, current_user: User, data: RFQUpdate) -> RFQ:
    rfq = await get_rfq(db, rfq_id, current_user)

    if rfq.status not in (RFQStatus.PARSED, RFQStatus.POOLING):
        raise PoolLockedError()

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    # If changing catalog item, validate it exists
    if "matched_catalog_item_id" in update_data:
        item = await catalog_repository.get_by_id(db, update_data["matched_catalog_item_id"])
        if not item or not item.is_active:
            raise NotFoundError("Catalog item not found or inactive.")
        update_data["catalog_item_id"] = update_data.pop("matched_catalog_item_id")

    rfq = await rfq_repository.update(db, rfq, update_data)
    if update_data:
        await db.commit()
        await db.refresh(rfq)
    return rfq


async def cancel_rfq(db: AsyncSession, rfq_id: str, current_user: User) -> None:
    rfq = await get_rfq(db, rfq_id, current_user)

    if rfq.status == RFQStatus.LOCKED:
        raise PoolLockedError()
    if rfq.status == RFQStatus.CANCELLED:
        return  # already cancelled, idempotent

    # Decrement pool quantity if RFQ was part of a pool
    if rfq.pool_id and rfq.parsed_quantity:
        pool = await pool_repository.get_by_id(db, rfq.pool_id)
        if pool and pool.status.value == "OPEN":
            await pool_repository.add_quantity(db, pool, -rfq.parsed_quantity)

    await rfq_repository.update(db, rfq, {"status": RFQStatus.CANCELLED})
    await db.commit()
