import math
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user, require_manufacturer
from app.models.user import User
from app.schemas.rfq import RFQParseRequest, RFQParseResponse, RFQCreate, RFQUpdate, RFQRead
from app.services import rfq_service
from app.utils.exceptions import create_success_response


def _paginated(data, total, page, page_size):
    return create_success_response(
        data=data,
        meta={
            "page": page, "pageSize": page_size,
            "totalItems": total,
            "totalPages": math.ceil(total / page_size) if page_size else 1,
        }
    )

router = APIRouter(prefix="/rfq", tags=["RFQ"])


@router.post("/parse", response_model=None, status_code=status.HTTP_200_OK)
async def parse_rfq(
    body: RFQParseRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manufacturer),
):
    """
    Parse free-text / voice-transcribed material request using Azure OpenAI (GPT-4.1).
    Returns a structured draft for the manufacturer to review — no RFQ is created yet.
    Supports Swahili and English input.
    """
    result = await rfq_service.parse_rfq(db, body.raw_text)
    return create_success_response(data=result)


@router.post("", response_model=None, status_code=status.HTTP_201_CREATED)
async def submit_rfq(
    body: RFQCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manufacturer),
):
    """
    Submit a confirmed RFQ. Automatically joins or creates a Pool for the matched catalog item.
    Auto-locks the pool if the bulk threshold quantity is reached.
    Supports idempotent submission via clientGeneratedId.
    """
    rfq = await rfq_service.submit_rfq(db, current_user, body)
    return create_success_response(data=RFQRead.model_validate(rfq))


@router.get("/mine", response_model=None, status_code=status.HTTP_200_OK)
async def list_my_rfqs(
    status: Optional[str] = Query(None, description="Filter by status: PARSED, POOLING, LOCKED, CANCELLED, FULFILLED"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manufacturer),
):
    """List the current manufacturer's RFQs with optional status filter."""
    rfqs, total = await rfq_service.list_mine(db, current_user, status, page, page_size)
    return _paginated(
        data=[RFQRead.model_validate(r) for r in rfqs],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{rfq_id}", response_model=None, status_code=status.HTTP_200_OK)
async def get_rfq(
    rfq_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single RFQ by ID. Manufacturer sees own RFQs only; Admin can see all."""
    rfq = await rfq_service.get_rfq(db, rfq_id, current_user)
    return create_success_response(data=RFQRead.model_validate(rfq))


@router.put("/{rfq_id}", response_model=None, status_code=status.HTTP_200_OK)
async def update_rfq(
    rfq_id: str,
    body: RFQUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manufacturer),
):
    """
    Update an RFQ. Only allowed while status is PARSED or POOLING (before pool locks).
    Returns 409 POOL_ALREADY_LOCKED if the pool has been locked.
    """
    rfq = await rfq_service.update_rfq(db, rfq_id, current_user, body)
    return create_success_response(data=RFQRead.model_validate(rfq))


@router.delete("/{rfq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_rfq(
    rfq_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_manufacturer),
):
    """
    Cancel an RFQ. Returns 409 if the pool is already locked.
    Automatically decrements the pool's total quantity.
    """
    await rfq_service.cancel_rfq(db, rfq_id, current_user)
