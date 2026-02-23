from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Role = Literal["patient", "provider"]


class PublicUser(BaseModel):
    id: str
    role: Role
    name: str
    email: EmailStr
    phone: str | None = None
    dateOfBirth: str | None = None
    specialization: str | None = None
    licenseNumber: str | None = None
    createdAt: str | None = None


class AuthLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)
    role: Role


class AuthSignupRequest(BaseModel):
    role: Role
    fullName: str = Field(min_length=2)
    email: EmailStr
    phone: str | None = None
    password: str = Field(min_length=6)
    confirmPassword: str = Field(min_length=6)

    dateOfBirth: date | None = None
    specialization: str | None = None
    licenseNumber: str | None = None


class AuthResponse(BaseModel):
    token: str
    user: PublicUser

