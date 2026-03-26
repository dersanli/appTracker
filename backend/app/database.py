import urllib.parse

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

settings = get_settings()

database_url = settings.database_url

# Normalise scheme to postgresql+asyncpg
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

# SQLAlchemy's asyncpg dialect does not forward `user`/`password` from
# connect_args — it always takes them from the URL.  However asyncpg itself
# accepts a raw DSN string via the `dsn` connect-arg and ignores all other
# keyword parameters in that case.  We therefore rebuild a plain asyncpg DSN
# and pass it as `dsn`, bypassing SQLAlchemy's URL parsing entirely for the
# credential fields.  SSL is required for Supabase direct connections.
_plain = database_url.replace("postgresql+asyncpg://", "postgresql://", 1)
_p = urllib.parse.urlparse(_plain)
_user = urllib.parse.unquote(_p.username or "")
_password = urllib.parse.unquote(_p.password or "")
_host = _p.hostname or ""
_port = _p.port or 5432
_dbname = _p.path.lstrip("/")

_dsn = f"postgresql://{urllib.parse.quote(_user, safe='')}:{urllib.parse.quote(_password, safe='')}@{_host}:{_port}/{_dbname}"

engine = create_async_engine(
    database_url,
    echo=False,
    pool_pre_ping=True,
    connect_args={
        "dsn": _dsn,
        "ssl": "require",
    },
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
