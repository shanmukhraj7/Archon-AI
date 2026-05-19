"""
SQLite schema and CRUD helpers using SQLAlchemy async.
"""

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


# ── Engine & session factory ──────────────────────────────────────────────────

_engine = None
_async_session = None


def get_engine(db_path: str):
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            f"sqlite+aiosqlite:///{db_path}",
            echo=False,
            connect_args={"check_same_thread": False},
        )
    return _engine


def get_session_factory(db_path: str):
    global _async_session
    if _async_session is None:
        engine = get_engine(db_path)
        _async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return _async_session


async def init_db(db_path: str):
    engine = get_engine(db_path)
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