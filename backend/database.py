from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from pymongo import MongoClient, ReturnDocument
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import PyMongoError


_BACKEND_DIR = Path(__file__).resolve().parent

_client: MongoClient | None = None
_db: Database | None = None


def _load_env() -> None:
    # Load backend/.env if present (local dev); otherwise rely on process env.
    load_dotenv(dotenv_path=_BACKEND_DIR / ".env", override=False)


def get_db() -> Database:
    global _client, _db

    if _db is not None:
        return _db

    _load_env()
    uri = (os.getenv("MONGODB_URI") or "").strip()
    if not uri:
        raise RuntimeError(
            "MONGODB_URI is not set. Create backend/.env with MONGODB_URI=... (or set it in your environment)."
        )
    db_name = (os.getenv("MONGODB_DB") or "medpredict").strip() or "medpredict"

    if uri.startswith("mock://"):
        try:
            import mongomock  # type: ignore
        except Exception as e:
            raise RuntimeError("mongomock is required for MONGODB_URI=mock://...") from e
        _client = mongomock.MongoClient()
    else:
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    _db = _client[db_name]
    return _db


def test_connection() -> None:
    db = get_db()
    try:
        db.command("ping")
    except Exception as e:
        raise RuntimeError("Could not connect to MongoDB") from e
    print("MongoDB connected successfully", flush=True)


def init_mongo() -> None:
    test_connection()
    db = get_db()

    # Users
    db.users.create_index("email", unique=True, name="uniq_users_email")
    db.users.create_index("doctor_code", unique=True, sparse=True, name="uniq_users_doctor_code")

    # Tokens
    db.tokens.create_index("user_id", name="idx_tokens_user_id")

    # Doctor-patient assignments
    db.doctor_patient.create_index("doctor_user_id", name="idx_doctor_patient_doctor_user_id")

    # Patient profiles
    db.patient_profiles.create_index("patient_code", unique=True, sparse=True, name="uniq_patient_profiles_code")

    # Health entries
    db.health_entries.create_index("patient_user_id", name="idx_health_entries_patient_user_id")
    db.health_entries.create_index("created_at", name="idx_health_entries_created_at")

    # Optional history
    db.risk_assessments.create_index("patient_user_id", name="idx_risk_assessments_patient_user_id")
    db.risk_assessments.create_index("created_at", name="idx_risk_assessments_created_at")
    db.ml_predictions.create_index("provider_user_id", name="idx_ml_predictions_provider_user_id")
    db.ml_predictions.create_index("created_at", name="idx_ml_predictions_created_at")

    # Counters seed
    db.counters.update_one(
        {"_id": "patient_profiles_seq"},
        {"$setOnInsert": {"seq": 0}},
        upsert=True,
    )


def next_sequence(db: Database, *, counter_id: str) -> int:
    doc = db.counters.find_one_and_update(
        {"_id": counter_id},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int((doc or {}).get("seq") or 0)


def safe_insert_one(col: Collection, doc: dict[str, Any]) -> Any:
    try:
        return col.insert_one(doc).inserted_id
    except PyMongoError as e:
        raise RuntimeError("Database error") from e

