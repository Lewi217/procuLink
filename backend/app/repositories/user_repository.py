import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    return result.scalars().first()


async def get_by_id(db: AsyncSession, user_id: uuid.UUID | str) -> User | None:
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalars().first()


async def create(db: AsyncSession, user_data: dict) -> User:
    db_user = User(**user_data)
    db.add(db_user)
    await db.flush()
    await db.refresh(db_user)
    return db_user


async def get_users_list(
    db: AsyncSession,
    role: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20
) -> tuple[list[User], int]:
    stmt = select(User)
    
    if role:
        stmt = stmt.where(User.role == role)
    if status:
        is_active = status.upper() == "ACTIVE"
        stmt = stmt.where(User.is_active == is_active)
        
    # Get total count
    from sqlalchemy import func
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total_items = total_result.scalar() or 0
    
    # Get paginated data
    stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    return list(users), total_items


async def update_status(db: AsyncSession, user_id: uuid.UUID | str, status: str) -> User | None:
    user = await get_by_id(db, user_id)
    if not user:
        return None
    user.is_active = (status.upper() == "ACTIVE")
    await db.flush()
    await db.refresh(user)
    return user
