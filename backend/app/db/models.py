"""
Database schema and CRUD helpers using SQLAlchemy async.
Supports PostgreSQL (asyncpg) and SQLite (aiosqlite) via DATABASE_URL env var.
"""

import os
import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import Column, String, DateTime, Text, Integer
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.future import select

Base = declarative_base()


class QueryRecord(Base):
    __tablename__ = "queries"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    query = Column(Text, nullable=False)
    report_markdown = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending | running | done | error
    error_message = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)  # JSON blob for agent scores
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UploadedDocument(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Engine & session factory ──────────────────────────────────────────────────

_engine = None
_async_session = None


def _get_database_url() -> str:
    """
    Resolve the async database URL from environment variables.

    Priority:
      1. DATABASE_URL  — full DSN (Postgres on Docker/GCP/cloud)
      2. SQLITE_DB_PATH — legacy local SQLite path
      3. /tmp/history.db  — hard fallback for local dev

    Postgres DSN variants are normalised to postgresql+asyncpg://.
    """
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url:
        # Fix plain postgres:// or postgresql:// (no async driver specified)
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif db_url.startswith("postgresql://") and "+asyncpg" not in db_url:
            db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return db_url
    # Fallback: SQLite for local development without Postgres
    sqlite_path = os.environ.get("SQLITE_DB_PATH", "/tmp/history.db")
    return f"sqlite+aiosqlite:///{sqlite_path}"


def get_engine():
    global _engine
    if _engine is None:
        url = _get_database_url()
        is_sqlite = url.startswith("sqlite")
        connect_args = {"check_same_thread": False} if is_sqlite else {}
        _engine = create_async_engine(url, echo=False, connect_args=connect_args)
    return _engine


def get_session_factory():
    global _async_session
    if _async_session is None:
        engine = get_engine()
        _async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return _async_session


async def init_db():
    """Create all tables if they don't exist (runs at startup)."""
    engine = get_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# ── CRUD helpers ──────────────────────────────────────────────────────────────

async def create_query(session: AsyncSession, query_text: str) -> QueryRecord:
    record = QueryRecord(
        id=str(uuid.uuid4()),
        query=query_text,
        status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(record)
    await session.commit()
    await session.refresh(record)
    return record


async def update_query(
    session: AsyncSession,
    record_id: str,
    status: str,
    report_markdown: Optional[str] = None,
    error_message: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> Optional[QueryRecord]:
    import json as _json
    result = await session.execute(select(QueryRecord).where(QueryRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        return None
    record.status = status
    record.updated_at = datetime.utcnow()
    if report_markdown is not None:
        record.report_markdown = report_markdown
    if error_message is not None:
        record.error_message = error_message
    if metadata is not None:
        record.metadata_json = _json.dumps(metadata)
    await session.commit()
    await session.refresh(record)
    return record


async def get_query(session: AsyncSession, record_id: str) -> Optional[QueryRecord]:
    result = await session.execute(select(QueryRecord).where(QueryRecord.id == record_id))
    return result.scalar_one_or_none()


async def list_queries(session: AsyncSession, limit: int = 50) -> List[QueryRecord]:
    result = await session.execute(
        select(QueryRecord).order_by(QueryRecord.created_at.desc()).limit(limit)
    )
    return result.scalars().all()


async def delete_query(session: AsyncSession, record_id: str) -> bool:
    result = await session.execute(select(QueryRecord).where(QueryRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        return False
    await session.delete(record)
    await session.commit()
    return True


async def create_document(
    session: AsyncSession, filename: str, file_path: str, chunk_count: int = 0
) -> UploadedDocument:
    doc = UploadedDocument(
        id=str(uuid.uuid4()),
        filename=filename,
        file_path=file_path,
        chunk_count=chunk_count,
        created_at=datetime.utcnow(),
    )
    session.add(doc)
    await session.commit()
    await session.refresh(doc)
    return doc


async def list_documents(session: AsyncSession) -> List[UploadedDocument]:
    result = await session.execute(
        select(UploadedDocument).order_by(UploadedDocument.created_at.desc())
    )
    return result.scalars().all()


# ── User CRUD ────────────────────────────────────────────────────────────────

async def create_user(
    session: AsyncSession, username: str, email: str, password_hash: str
) -> User:
    user = User(
        id=str(uuid.uuid4()),
        username=username,
        email=email.lower().strip(),
        password_hash=password_hash,
        created_at=datetime.utcnow(),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def get_user_by_email(session: AsyncSession, email: str) -> Optional["User"]:
    result = await session.execute(
        select(User).where(User.email == email.lower().strip())
    )
    return result.scalar_one_or_none()


async def get_user_by_id(session: AsyncSession, user_id: str) -> Optional["User"]:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()