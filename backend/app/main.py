from __future__ import annotations

import math
import os
from pathlib import Path
from datetime import date, datetime
from typing import Literal
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import Base, engine
from .deps import get_current_user, get_db, require_role
from .models import User
from .schemas import AuthLoginRequest, AuthResponse, AuthSignupRequest
from .security import create_access_token, hash_password, verify_password

load_dotenv()

API_PREFIX = os.getenv("API_PREFIX", "/api")


def _now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


Role = Literal["patient", "provider"]


class ProviderOverviewResponse(BaseModel):
    totalPatients: int
    highRisk: int
    assessmentsToday: int
    avgRiskScore: int
    highRiskPatients: list[dict]
    recentAssessments: list[dict]
    systemAlerts: list[dict]


class PatientListResponse(BaseModel):
    items: list[dict]


class PatientCreateRequest(BaseModel):
    name: str = Field(min_length=2)
    age: int = Field(ge=0, le=120)
    gender: Literal["Male", "Female", "Other"]


class RiskAssessmentRequest(BaseModel):
    patientId: str | None = None
    age: int = Field(ge=0, le=120)
    gender: Literal["Male", "Female", "Other"]
    systolic: int = Field(ge=60, le=260)
    diastolic: int = Field(ge=40, le=160)
    cholesterol: int = Field(ge=80, le=400)
    bloodSugar: int = Field(ge=40, le=600)
    bmi: float = Field(ge=10, le=60)
    smoking: Literal["No", "Yes"]
    familyHistory: Literal["No", "Yes"]
    exerciseLevel: Literal["Low", "Moderate", "High"]
    dietQuality: Literal["Poor", "Balanced", "Excellent"]


class RiskAssessmentResponse(BaseModel):
    overallRisk: int
    label: Literal["low", "moderate", "high", "critical"]
    heartDisease: int
    diabetes: int
    hypertension: int
    generatedAt: str


class AnalyticsResponse(BaseModel):
    assessmentTrends: dict
    diseaseDistribution: dict
    riskLevelDistribution: dict
    ageGroupRisk: dict


class HealthEntryRequest(BaseModel):
    systolic: int = Field(ge=60, le=260)
    diastolic: int = Field(ge=40, le=160)
    heartRate: int = Field(ge=30, le=220)
    bloodSugar: int = Field(ge=40, le=600)
    weightKg: float = Field(ge=20, le=300)
    sleepHours: float = Field(ge=0, le=24)
    exerciseMinutes: int = Field(ge=0, le=1440)
    mood: Literal["Great", "Good", "Okay", "Bad"]
    notes: str | None = None


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class AssistantChatResponse(BaseModel):
    answer: str
    generatedAt: str


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def _compute_risk(req: RiskAssessmentRequest) -> RiskAssessmentResponse:
    age_factor = _clamp01((req.age - 25) / 55)
    bp_factor = _clamp01(((req.systolic - 110) / 60 + (req.diastolic - 70) / 50) / 2)
    chol_factor = _clamp01((req.cholesterol - 160) / 120)
    sugar_factor = _clamp01((req.bloodSugar - 90) / 170)
    bmi_factor = _clamp01((req.bmi - 22) / 18)
    smoke_factor = 1.0 if req.smoking == "Yes" else 0.0
    fam_factor = 1.0 if req.familyHistory == "Yes" else 0.0
    exercise_factor = {"Low": 1.0, "Moderate": 0.5, "High": 0.1}[req.exerciseLevel]
    diet_factor = {"Poor": 1.0, "Balanced": 0.5, "Excellent": 0.1}[req.dietQuality]

    base = (
        1.15 * age_factor
        + 1.35 * bp_factor
        + 1.05 * chol_factor
        + 1.10 * sugar_factor
        + 0.95 * bmi_factor
        + 0.60 * smoke_factor
        + 0.55 * fam_factor
        + 0.45 * exercise_factor
        + 0.35 * diet_factor
    )

    overall = int(round(_clamp01(_sigmoid((base - 2.2) * 2.1)) * 100))
    heart = int(round(_clamp01(_sigmoid((1.2 * age_factor + 1.4 * bp_factor + 1.1 * chol_factor + 0.6 * smoke_factor - 1.3) * 2.0)) * 100))
    diab = int(round(_clamp01(_sigmoid((1.2 * sugar_factor + 0.9 * bmi_factor + 0.4 * fam_factor + 0.3 * diet_factor - 1.2) * 2.2)) * 100))
    htn = int(round(_clamp01(_sigmoid((1.8 * bp_factor + 0.6 * age_factor + 0.4 * bmi_factor + 0.2 * smoke_factor - 1.05) * 2.1)) * 100))

    if overall >= 85:
        label: Literal["low", "moderate", "high", "critical"] = "critical"
    elif overall >= 70:
        label = "high"
    elif overall >= 40:
        label = "moderate"
    else:
        label = "low"

    return RiskAssessmentResponse(
        overallRisk=overall,
        label=label,
        heartDisease=heart,
        diabetes=diab,
        hypertension=htn,
        generatedAt=_now_iso(),
    )


app = FastAPI(
    title="MedPredict API",
    version="0.1.0",
    docs_url=f"{API_PREFIX}/docs",
    openapi_url=f"{API_PREFIX}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database tables
Base.metadata.create_all(bind=engine)

ROOT_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"

PATIENTS: list[dict] = [
    {
        "id": "P001",
        "name": "John Doe",
        "age": 58,
        "gender": "Male",
        "lastVisit": "2026-02-05",
        "riskScore": 85,
        "status": "critical",
        "condition": "Heart Disease",
    },
    {
        "id": "P002",
        "name": "Jane Smith",
        "age": 62,
        "gender": "Female",
        "lastVisit": "2026-02-07",
        "riskScore": 78,
        "status": "high",
        "condition": "Diabetes",
    },
    {
        "id": "P003",
        "name": "Mike Johnson",
        "age": 45,
        "gender": "Male",
        "lastVisit": "2026-02-06",
        "riskScore": 72,
        "status": "high",
        "condition": "Hypertension",
    },
    {
        "id": "P004",
        "name": "Sarah Williams",
        "age": 55,
        "gender": "Female",
        "lastVisit": "2026-02-08",
        "riskScore": 68,
        "status": "moderate",
        "condition": "Stroke",
    },
    {
        "id": "P005",
        "name": "David Brown",
        "age": 42,
        "gender": "Male",
        "lastVisit": "2026-02-07",
        "riskScore": 35,
        "status": "low",
        "condition": "N/A",
    },
    {
        "id": "P006",
        "name": "Emma Wilson",
        "age": 38,
        "gender": "Female",
        "lastVisit": "2026-02-08",
        "riskScore": 28,
        "status": "low",
        "condition": "N/A",
    },
    {
        "id": "P007",
        "name": "Robert Taylor",
        "age": 67,
        "gender": "Male",
        "lastVisit": "2026-02-04",
        "riskScore": 82,
        "status": "critical",
        "condition": "Heart Disease",
    },
    {
        "id": "P008",
        "name": "Lisa Anderson",
        "age": 51,
        "gender": "Female",
        "lastVisit": "2026-02-08",
        "riskScore": 45,
        "status": "moderate",
        "condition": "Hypertension",
    },
    {
        "id": "P009",
        "name": "Komeza Manase",
        "age": 34,
        "gender": "Male",
        "lastVisit": "2026-02-17",
        "riskScore": 0,
        "status": "low",
        "condition": "N/A",
    },
]

PROVIDER_OVERVIEW = {
    "totalPatients": 1247,
    "highRisk": 84,
    "assessmentsToday": 23,
    "avgRiskScore": 42,
    "highRiskPatients": [
        {"name": "John Doe", "id": "P001", "age": 58, "condition": "Heart Disease", "risk": 85, "tag": "critical"},
        {"name": "Jane Smith", "id": "P002", "age": 62, "condition": "Diabetes", "risk": 78, "tag": "high"},
        {"name": "Mike Johnson", "id": "P003", "age": 45, "condition": "Hypertension", "risk": 72, "tag": "high"},
        {"name": "Sarah Williams", "id": "P004", "age": 55, "condition": "Stroke", "risk": 68, "tag": "moderate"},
    ],
    "recentAssessments": [
        {"name": "John Doe", "timeAgo": "10 minutes ago", "level": "High Risk"},
        {"name": "Emma Wilson", "timeAgo": "1 hour ago", "level": "Low Risk"},
        {"name": "David Brown", "timeAgo": "2 hours ago", "level": "Moderate Risk"},
        {"name": "Lisa Anderson", "timeAgo": "3 hours ago", "level": "Low Risk"},
    ],
    "systemAlerts": [
        {"type": "warning", "text": "3 patients need follow-up appointments", "timeAgo": "30 min ago"},
        {"type": "info", "text": "Monthly report is ready for review", "timeAgo": "2 hours ago"},
        {"type": "success", "text": "System backup completed successfully", "timeAgo": "5 hours ago"},
    ],
}

PATIENT_DASHBOARD = {
    "user": {"name": "John Doe", "role": "patient"},
    "overallHealthScore": 87,
    "delta": "+5 points from last month",
    "metrics": [
        {"label": "Heart Rate", "value": "72 bpm", "trend": "+2% vs last week", "status": "normal"},
        {"label": "Blood Pressure", "value": "120/80", "trend": "-3% vs last week", "status": "normal"},
        {"label": "Blood Sugar", "value": "98 mg/dL", "trend": "+5% vs last week", "status": "normal"},
        {"label": "Stress Level", "value": "Low", "trend": "-12% vs last week", "status": "good"},
    ],
    "insights": [
        {"type": "success", "title": "Great Progress!", "text": "Your blood pressure has improved by 8% over the last month."},
        {"type": "warning", "title": "Activity Reminder", "text": "You've been less active this week. Try to reach 10,000 steps daily."},
        {"type": "info", "title": "Health Tip", "text": "Based on your data, consider reducing sodium intake to maintain healthy blood pressure."},
    ],
    "appointments": [
        {"type": "General Checkup", "doctor": "Dr. Sarah Smith", "date": "2026-02-12", "time": "10:00 AM"},
        {"type": "Follow-up", "doctor": "Dr. John Wilson", "date": "2026-02-20", "time": "2:30 PM"},
    ],
    "latestRisk": {
        "summary": "Based on your recent health data, your overall disease risk is Low to Moderate.",
        "heartDisease": 28,
        "diabetes": 15,
        "hypertension": 35,
    },
}

HEALTH_ENTRIES: list[dict] = [
    {
        "id": "E001",
        "type": "Blood Pressure",
        "value": "120/80 mmHg",
        "tag": "normal",
        "recordedAt": "2026-02-08 08:30 AM",
    },
    {"id": "E002", "type": "Weight", "value": "78.2 kg", "tag": "progress", "recordedAt": "2026-02-08 07:15 AM"},
    {"id": "E003", "type": "Sleep", "value": "7.9 hours", "tag": "good", "recordedAt": "2026-02-07 11:00 PM"},
]


def _public_user(u: User) -> dict:
    return {
        "id": u.id,
        "role": u.role,
        "name": u.full_name,
        "email": u.email,
        "phone": u.phone,
        "dateOfBirth": u.date_of_birth.isoformat() if u.date_of_birth else None,
        "specialization": u.specialization,
        "licenseNumber": u.license_number,
        "createdAt": u.created_at.replace(microsecond=0).isoformat() + "Z" if u.created_at else None,
    }


@app.get(f"{API_PREFIX}/health")
def health():
    return {"ok": True, "time": _now_iso()}


@app.post(f"{API_PREFIX}/auth/login", response_model=AuthResponse)
def login(req: AuthLoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == req.email))
    if not user or user.role != req.role:
        raise HTTPException(status_code=401, detail="Invalid email/password")
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email/password")

    token = create_access_token(subject=user.id, role=user.role)
    return {"token": token, "user": _public_user(user)}


@app.post(f"{API_PREFIX}/auth/signup", response_model=AuthResponse)
def signup(req: AuthSignupRequest, db: Session = Depends(get_db)):
    if req.password != req.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing = db.scalar(select(User).where(User.email == req.email))
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    if req.role == "provider":
        if not (req.specialization and req.licenseNumber):
            raise HTTPException(status_code=400, detail="Specialization and license number are required for providers")

    user = User(
        id=uuid4().hex,
        role=req.role,
        full_name=req.fullName,
        email=req.email,
        phone=req.phone,
        date_of_birth=req.dateOfBirth,
        specialization=req.specialization,
        license_number=req.licenseNumber,
        password_hash=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return {"token": token, "user": _public_user(user)}


@app.get(f"{API_PREFIX}/auth/me")
def me(user: User = Depends(get_current_user)):
    return {"user": _public_user(user)}


@app.get(f"{API_PREFIX}/provider/overview", response_model=ProviderOverviewResponse)
def provider_overview(_user: User = Depends(require_role("provider"))):
    return PROVIDER_OVERVIEW


@app.get(f"{API_PREFIX}/provider/patients", response_model=PatientListResponse)
def provider_patients(_user: User = Depends(require_role("provider"))):
    return {"items": PATIENTS}


@app.post(f"{API_PREFIX}/provider/patients", response_model=dict)
def provider_add_patient(req: PatientCreateRequest, _user: User = Depends(require_role("provider"))):
    next_num = len(PATIENTS) + 1
    patient_id = f"P{next_num:03d}"
    patient = {
        "id": patient_id,
        "name": req.name,
        "age": req.age,
        "gender": req.gender,
        "lastVisit": date.today().isoformat(),
        "riskScore": 0,
        "status": "low",
        "condition": "N/A",
    }
    PATIENTS.append(patient)
    return patient


@app.post(f"{API_PREFIX}/provider/assess", response_model=RiskAssessmentResponse)
def provider_assess(req: RiskAssessmentRequest, _user: User = Depends(require_role("provider"))):
    result = _compute_risk(req)
    if req.patientId:
        for p in PATIENTS:
            if p["id"] == req.patientId:
                p["riskScore"] = result.overallRisk
                p["status"] = result.label
                p["lastVisit"] = date.today().isoformat()
                p["condition"] = max(
                    [
                        ("Heart Disease", result.heartDisease),
                        ("Diabetes", result.diabetes),
                        ("Hypertension", result.hypertension),
                    ],
                    key=lambda x: x[1],
                )[0]
                break
    return result


@app.get(f"{API_PREFIX}/provider/analytics", response_model=AnalyticsResponse)
def provider_analytics(_user: User = Depends(require_role("provider"))):
    return {
        "assessmentTrends": {
            "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            "totalAssessments": [145, 132, 160, 175, 168, 190],
            "highRiskCases": [22, 18, 26, 29, 25, 34],
        },
        "diseaseDistribution": {
            "labels": ["Heart Disease", "Diabetes", "Hypertension", "Stroke", "Other"],
            "values": [342, 287, 198, 156, 89],
        },
        "riskLevelDistribution": {
            "labels": ["Low Risk", "Moderate Risk", "High Risk", "Critical"],
            "values": [654, 312, 198, 83],
        },
        "ageGroupRisk": {
            "labels": ["20-30", "31-40", "41-50", "51-60", "61-70", "71+"],
            "values": [18, 28, 42, 58, 72, 79],
        },
    }


@app.get(f"{API_PREFIX}/patient/dashboard")
def patient_dashboard(user: User = Depends(require_role("patient"))):
    payload = dict(PATIENT_DASHBOARD)
    payload["user"] = {"name": user.full_name, "role": user.role}
    return payload


@app.get(f"{API_PREFIX}/patient/health-entries")
def patient_health_entries(_user: User = Depends(require_role("patient"))):
    return {"items": HEALTH_ENTRIES}


@app.post(f"{API_PREFIX}/patient/health-entries")
def patient_add_health_entry(req: HealthEntryRequest, _user: User = Depends(require_role("patient"))):
    entry_id = f"E{len(HEALTH_ENTRIES) + 1:03d}"
    HEALTH_ENTRIES.insert(
        0,
        {
            "id": entry_id,
            "type": "Custom Entry",
            "value": f"BP {req.systolic}/{req.diastolic}, HR {req.heartRate}, Sugar {req.bloodSugar}",
            "tag": "logged",
            "recordedAt": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
            "raw": req.model_dump(),
        },
    )
    return {"ok": True, "id": entry_id}


@app.get(f"{API_PREFIX}/patient/trends")
def patient_trends(_user: User = Depends(require_role("patient"))):
    return {
        "heartRate": {
            "labels": ["Feb 1", "Feb 2", "Feb 3", "Feb 4", "Feb 5", "Feb 6", "Feb 7", "Feb 8"],
            "average": [74, 73, 77, 72, 74, 71, 72, 70],
            "resting": [68, 67, 69, 66, 68, 67, 68, 67],
            "summary": {"avg": 73, "lowest": 66, "highest": 78},
        },
        "bloodPressure": {
            "labels": ["Feb 1", "Feb 2", "Feb 3", "Feb 4", "Feb 5", "Feb 6", "Feb 7", "Feb 8"],
            "systolic": [125, 122, 130, 118, 119, 121, 120, 123],
            "diastolic": [82, 80, 85, 78, 79, 80, 80, 81],
        },
        "weight": {"labels": ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"], "values": [82, 81.4, 80.7, 79.9, 79.2, 78.6, 78.2]},
        "sleep": {"labels": ["Feb 1", "Feb 2", "Feb 3", "Feb 4", "Feb 5", "Feb 6", "Feb 7", "Feb 8"], "values": [6.9, 6.6, 7.8, 7.1, 7.7, 6.8, 7.4, 7.6]},
        "summaryCards": {"weightProgressKg": -3.8, "weightGoalKg": 75, "avgSleepHours": 7.5},
    }


@app.post(f"{API_PREFIX}/patient/assistant/chat", response_model=AssistantChatResponse)
def patient_assistant_chat(req: AssistantChatRequest, _user: User = Depends(require_role("patient"))):
    msg = req.message.strip().lower()
    if "sleep" in msg:
        answer = "For better sleep quality: keep a consistent schedule, limit caffeine after midday, and avoid screens 30–60 minutes before bed. If your average stays below 7 hours, aim to add 15–30 minutes this week."
    elif "diabetes" in msg or "blood sugar" in msg:
        answer = "To reduce diabetes risk: prioritize high-fiber meals (vegetables, legumes, whole grains), reduce sugary drinks, and aim for 150 minutes/week of moderate exercise. Keeping BMI and fasting glucose in range helps most."
    elif "exercise" in msg:
        answer = "A simple plan: 30 minutes brisk walking 5 days/week + 2 days of light strength training. If you're new, start with 10–15 minutes and increase gradually."
    else:
        answer = "I can help interpret your trends and suggest habits. Tell me what you want to improve (blood pressure, sleep, weight, blood sugar), and I’ll suggest a simple next step."
    return {"answer": answer, "generatedAt": _now_iso()}


def _api_prefix_segment() -> str:
    return API_PREFIX.strip("/") or "api"


def _frontend_index() -> Path:
    return FRONTEND_DIST / "index.html"


def _safe_dist_path(rel: str) -> Path | None:
    rel = (rel or "").lstrip("/")
    candidate = (FRONTEND_DIST / rel).resolve()
    try:
        candidate.relative_to(FRONTEND_DIST.resolve())
    except ValueError:
        return None
    return candidate


# Single-port mode (8000): serve frontend build if present.
@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    api_seg = _api_prefix_segment()
    if full_path == api_seg or full_path.startswith(api_seg + "/"):
        raise HTTPException(status_code=404, detail="Not found")

    if not FRONTEND_DIST.exists() or not _frontend_index().exists():
        raise HTTPException(
            status_code=404,
            detail="Frontend not built. Run: cd frontend && npm install && npm run build",
        )

    path = _safe_dist_path(full_path)
    if path and path.exists() and path.is_file():
        return FileResponse(str(path))
    return FileResponse(str(_frontend_index()))

