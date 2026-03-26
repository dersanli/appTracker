import urllib.parse

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

# Ensure the URL uses asyncpg driver
database_url = settings.database_url
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

# asyncpg misparses usernames containing dots (e.g. Supabase pooler format
# "postgres.project-ref") and drops the suffix. Extract user/password from the
# URL and pass them via connect_args so asyncpg receives the full username.
_plain_url = database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
_parsed = urllib.parse.urlparse(_plain_url)
_connect_args: dict = {}
if _parsed.username:
    _connect_args["user"] = urllib.parse.unquote(_parsed.username)
if _parsed.password:
    _connect_args["password"] = urllib.parse.unquote(_parsed.password)

engine = create_async_engine(
    database_url,
    echo=False,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
