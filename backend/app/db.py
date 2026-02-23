from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker


def _database_url() -> str:
    url = (os.getenv("DATABASE_URL") or "").strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. This SQLAlchemy backend is deprecated; run backend/server.py with MONGODB_URI instead."
        )
    if url.lower().startswith("sqlite"):
        raise RuntimeError("SQLite is not supported. Set DATABASE_URL to a non-SQLite database.")
    return url


engine = create_engine(
    _database_url(),
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass

