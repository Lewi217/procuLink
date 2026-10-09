from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


def _build_async_url(database_url: str) -> str:
    """
    Convert a standard postgresql:// URL to postgresql+asyncpg://
    and strip psycopg2-style query params that asyncpg does not understand
    (sslmode, channel_binding, etc.).
    """
    url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

    parsed = urlparse(url)
    params = parse_qs(parsed.query)

    # Remove params that are libpq/psycopg2-specific — asyncpg rejects them
    for key in ("sslmode", "channel_binding", "connect_timeout"):
        params.pop(key, None)

    clean_query = urlencode({k: v[0] for k, v in params.items()})
    return urlunparse(parsed._replace(query=clean_query))


engine = create_async_engine(
    _build_async_url(settings.DATABASE_URL),
    echo=False,
    connect_args={
        # Pass ssl as a string so asyncpg uses SCRAM-SHA-256
        # (not SCRAM-SHA-256-PLUS) — compatible with Neon's PgBouncer pooler
        "ssl": "require",
        "server_settings": {"application_name": "proculink"},
        "statement_cache_size": 0,
    },
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=60,
    pool_use_lifo=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass
