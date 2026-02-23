from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _jwt_secret() -> str:
    # For real deployments, set JWT_SECRET in env.
    return os.getenv("JWT_SECRET", "dev_only_change_me")


def _jwt_ttl_minutes() -> int:
    try:
        return int(os.getenv("JWT_TTL_MINUTES", "120"))
    except ValueError:
        return 120


def create_access_token(*, subject: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(minutes=_jwt_ttl_minutes())
    payload = {"sub": subject, "role": role, "iat": int(now.timestamp()), "exp": exp}
    return jwt.encode(payload, _jwt_secret(), algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
    except JWTError as e:
        raise ValueError("Invalid token") from e

