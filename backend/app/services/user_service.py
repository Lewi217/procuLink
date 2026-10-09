import jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import user_repository
from app.schemas.user import UserCreate, UserLogin, Token
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    ALGORITHM,
)
from app.core.config import settings
from app.utils.exceptions import DuplicateResourceError, InvalidCredentialsError


async def register_user(db: AsyncSession, user_in: UserCreate) -> object:
    existing = await user_repository.get_by_email(db, user_in.email)
    if existing:
        raise DuplicateResourceError(
            message="An account with this email address already exists.",
        )

    user_data = user_in.model_dump(exclude={"password"})
    user_data["password_hash"] = get_password_hash(user_in.password)

    user = await user_repository.create(db, user_data)
    return user


async def login_user(db: AsyncSession, login_in: UserLogin) -> Token:
    user = await user_repository.get_by_email(db, login_in.email)
    if not user or not verify_password(login_in.password, user.password_hash):
        raise InvalidCredentialsError(message="Incorrect email or password.")

    if not user.is_active:
        raise InvalidCredentialsError(message="This account has been deactivated.")

    access_token = create_access_token(subject=str(user.id))
    refresh_token = create_refresh_token(subject=str(user.id))

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user_id=user.id,
    )


async def refresh_user_token(db: AsyncSession, refresh_token: str) -> Token:
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise InvalidCredentialsError(message="Invalid token type.")
        user_id = payload.get("sub")
        if not user_id:
            raise InvalidCredentialsError(message="Invalid token payload.")
    except jwt.ExpiredSignatureError:
        raise InvalidCredentialsError(message="Refresh token has expired.")
    except jwt.PyJWTError:
        raise InvalidCredentialsError(message="Could not validate credentials.")

    user = await user_repository.get_by_id(db, user_id)
    if not user:
        raise InvalidCredentialsError(message="User not found.")

    access_token = create_access_token(subject=str(user.id))
    new_refresh_token = create_refresh_token(subject=str(user.id))

    return Token(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user_id=user.id,
    )
