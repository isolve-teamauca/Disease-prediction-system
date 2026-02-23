from __future__ import annotations

import base64
import hashlib
import hmac
import json
import math
import os
import secrets
import threading
from datetime import date, datetime
from http import HTTPStatus
from http.client import HTTPConnection
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Literal
from urllib.parse import parse_qs, urlparse

from pymongo.errors import DuplicateKeyError, PyMongoError

from database import get_db, init_mongo, next_sequence


ROOT_DIR = Path(__file__).resolve().parents[1]
DIST_DIR = ROOT_DIR / "frontend" / "dist"

API_PREFIX = "/api"
ML_SERVICE_HOST = os.getenv("ML_SERVICE_HOST", "127.0.0.1")
ML_SERVICE_PORT = int(os.getenv("ML_SERVICE_PORT", "8001"))

Role = Literal["patient", "provider"]


def now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def json_response(handler: BaseHTTPRequestHandler, status: int, payload: Any) -> None:
    raw = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(raw)))
    handler.end_headers()
    handler.wfile.write(raw)


def _proxy_ml(
    handler: BaseHTTPRequestHandler,
    *,
    method: str,
    path: str,
    body: dict | None,
    log_doc: dict | None = None,
) -> None:
    try:
        conn = HTTPConnection(ML_SERVICE_HOST, ML_SERVICE_PORT, timeout=4)
        raw = json.dumps(body or {}).encode("utf-8") if method.upper() == "POST" else b""
        headers = {"Content-Type": "application/json"} if method.upper() == "POST" else {}
        conn.request(method.upper(), path, body=raw if raw else None, headers=headers)
        resp = conn.getresponse()
        data = resp.read()

        if log_doc and (200 <= int(resp.status) < 300):
            try:
                parsed: Any
                try:
                    parsed = json.loads((data or b"{}").decode("utf-8") or "{}")
                except Exception:
                    parsed = {"raw": (data or b"").decode("utf-8", errors="replace")}
                db = get_db()
                db.ml_predictions.insert_one(
                    {
                        **log_doc,
                        "created_at": now_iso(),
                        "status": int(resp.status),
                        "response": parsed,
                    }
                )
            except Exception:
                # Never fail the proxy because logging failed.
                pass

        handler.send_response(resp.status)
        handler.send_header("Content-Type", resp.getheader("Content-Type") or "application/json; charset=utf-8")
        handler.send_header("Content-Length", str(len(data)))
        handler.end_headers()
        handler.wfile.write(data)
    except Exception:
        json_response(
            handler,
            503,
            {
                "detail": "ML prediction service unavailable. Start it with: python -m uvicorn ml_service.app:app --host 127.0.0.1 --port 8001"
            },
        )


def file_response(handler: BaseHTTPRequestHandler, path: Path) -> None:
    if not path.exists() or not path.is_file():
        handler.send_error(HTTPStatus.NOT_FOUND)
        return
    content = path.read_bytes()
    handler.send_response(HTTPStatus.OK)
    # Avoid stale SPA shell during development; hashed assets can be cached safely.
    if path.name == "index.html":
        handler.send_header("Cache-Control", "no-store")
    elif path.suffix.lower() in (".js", ".css", ".map"):
        handler.send_header("Cache-Control", "public, max-age=31536000, immutable")
    handler.send_header("Content-Length", str(len(content)))
    handler.send_header("Content-Type", guess_mime(path))
    handler.end_headers()
    handler.wfile.write(content)


def guess_mime(path: Path) -> str:
    ext = path.suffix.lower()
    return {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".ico": "image/x-icon",
        ".map": "application/json; charset=utf-8",
    }.get(ext, "application/octet-stream")


def _age_from_dob(dob_iso: str | None) -> int | None:
    if not dob_iso:
        return None
    try:
        d = date.fromisoformat(dob_iso)
    except ValueError:
        return None
    today = date.today()
    return today.year - d.year - (1 if (today.month, today.day) < (d.month, d.day) else 0)


def _patient_code_for_seq(seq: int) -> str:
    # P001..P999 then P1000+ automatically.
    width = 3 if seq < 1000 else 4
    return f"P{seq:0{width}d}"


def _ensure_patient_profile(user_id: str, *, gender: str | None = None) -> dict:
    db = get_db()
    doc = db.patient_profiles.find_one({"_id": user_id})
    if doc:
        return {
            "seq": int(doc.get("seq") or 0),
            "user_id": str(doc["_id"]),
            "patient_code": doc.get("patient_code"),
            "gender": doc.get("gender") or "Other",
            "last_visit": doc.get("last_visit"),
            "risk_score": int(doc.get("risk_score") or 0),
            "status": doc.get("status") or "low",
            "condition": doc.get("condition") or "N/A",
            "last_assessment_json": doc.get("last_assessment_json"),
            "last_assessed_at": doc.get("last_assessed_at"),
        }

    g = gender if gender in ("Male", "Female", "Other") else "Other"
    for _ in range(10):
        seq = next_sequence(db, counter_id="patient_profiles_seq")
        code = _patient_code_for_seq(seq)
        try:
            db.patient_profiles.insert_one(
                {
                    "_id": user_id,
                    "seq": int(seq),
                    "patient_code": code,
                    "gender": g,
                    "last_visit": None,
                    "risk_score": 0,
                    "status": "low",
                    "condition": "N/A",
                    "last_assessment_json": None,
                    "last_assessed_at": None,
                }
            )
            break
        except DuplicateKeyError:
            continue
    return _ensure_patient_profile(user_id)


def _doctor_code() -> str:
    # short, human-friendly code
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "DR-" + "".join(secrets.choice(alphabet) for _ in range(8))


def _ensure_doctor_code(doctor_user_id: str) -> str:
    db = get_db()
    existing = db.users.find_one({"_id": doctor_user_id}, {"doctor_code": 1})
    if existing and existing.get("doctor_code"):
        return str(existing["doctor_code"])

    for _ in range(30):
        code = _doctor_code().upper()
        try:
            res = db.users.update_one(
                {"_id": doctor_user_id, "$or": [{"doctor_code": {"$exists": False}}, {"doctor_code": None}, {"doctor_code": ""}]},
                {"$set": {"doctor_code": code}},
            )
            if res.modified_count:
                return code
            existing = db.users.find_one({"_id": doctor_user_id}, {"doctor_code": 1})
            if existing and existing.get("doctor_code"):
                return str(existing["doctor_code"])
        except DuplicateKeyError:
            continue
        except PyMongoError as e:
            raise RuntimeError("Database error") from e

    raise RuntimeError("Could not generate doctor code")


def pbkdf2_hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 210_000)
    return "pbkdf2_sha256$210000$" + base64.urlsafe_b64encode(salt).decode() + "$" + base64.urlsafe_b64encode(dk).decode()


def pbkdf2_verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters_s, salt_b64, dk_b64 = stored.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        iters = int(iters_s)
        salt = base64.urlsafe_b64decode(salt_b64.encode())
        dk_expected = base64.urlsafe_b64decode(dk_b64.encode())
        dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iters)
        return hmac.compare_digest(dk, dk_expected)
    except Exception:
        return False


def _user_from_doc(doc: dict | None) -> dict | None:
    if not doc:
        return None
    return {
        "id": str(doc["_id"]),
        "role": doc.get("role"),
        "full_name": doc.get("full_name"),
        "email": doc.get("email"),
        "phone": doc.get("phone"),
        "date_of_birth": doc.get("date_of_birth"),
        "specialization": doc.get("specialization"),
        "license_number": doc.get("license_number"),
        "doctor_code": doc.get("doctor_code"),
        "password_hash": doc.get("password_hash"),
        "created_at": doc.get("created_at"),
    }


def db_get_user_by_email(email: str) -> dict | None:
    db = get_db()
    doc = db.users.find_one({"email": email})
    return _user_from_doc(doc)


def db_get_user_by_id(user_id: str) -> dict | None:
    db = get_db()
    doc = db.users.find_one({"_id": user_id})
    return _user_from_doc(doc)


def db_issue_token(user_id: str) -> str:
    db = get_db()
    token = "mp_" + secrets.token_urlsafe(24)
    try:
        db.tokens.insert_one({"_id": token, "user_id": user_id, "created_at": now_iso()})
    except PyMongoError as e:
        raise RuntimeError("Database error") from e
    return token


def db_get_user_by_token(token: str) -> dict | None:
    db = get_db()
    t = db.tokens.find_one({"_id": token}, {"user_id": 1})
    if not t:
        return None
    return db_get_user_by_id(str(t.get("user_id") or ""))


def db_get_doctor_by_code(doctor_code: str) -> dict | None:
    db = get_db()
    code = (doctor_code or "").strip().upper()
    doc = db.users.find_one({"doctor_code": code, "role": "provider"})
    return _user_from_doc(doc)


def db_get_doctor_for_patient(patient_user_id: str) -> str | None:
    db = get_db()
    doc = db.doctor_patient.find_one({"_id": patient_user_id}, {"doctor_user_id": 1})
    return str(doc["doctor_user_id"]) if doc and doc.get("doctor_user_id") else None


def db_assign_patient_to_doctor(*, patient_user_id: str, doctor_user_id: str) -> None:
    db = get_db()
    existing = db.doctor_patient.find_one({"_id": patient_user_id}, {"doctor_user_id": 1})
    if existing:
        raise ValueError("Patient already assigned to a doctor")
    try:
        db.doctor_patient.insert_one({"_id": patient_user_id, "doctor_user_id": doctor_user_id, "created_at": now_iso()})
    except DuplicateKeyError:
        raise ValueError("Patient already assigned to a doctor")
    except PyMongoError as e:
        raise RuntimeError("Database error") from e


def db_get_assigned_patients(*, doctor_user_id: str) -> list[dict]:
    db = get_db()
    patient_ids = [d["_id"] for d in db.doctor_patient.find({"doctor_user_id": doctor_user_id}, {"_id": 1})]
    if not patient_ids:
        return []

    users = {u["_id"]: u for u in db.users.find({"_id": {"$in": patient_ids}}, {"full_name": 1, "date_of_birth": 1})}
    profiles = {
        p["_id"]: p
        for p in db.patient_profiles.find(
            {"_id": {"$in": patient_ids}},
            {"seq": 1, "patient_code": 1, "gender": 1, "last_visit": 1, "risk_score": 1, "status": 1, "condition": 1, "last_assessed_at": 1},
        )
    }

    rows: list[tuple[int, str, dict, dict]] = []
    for pid in patient_ids:
        u = users.get(pid) or {}
        p = profiles.get(pid) or {}
        rows.append((int(p.get("seq") or 0), pid, u, p))

    rows.sort(key=lambda x: x[0])
    items: list[dict] = []
    for _, pid, u, p in rows:
        items.append(
            {
                "id": p.get("patient_code") or pid,
                "name": u.get("full_name") or "",
                "age": _age_from_dob(u.get("date_of_birth")),
                "gender": p.get("gender") or "Other",
                "lastVisit": p.get("last_visit") or "",
                "riskScore": int(p.get("risk_score") or 0),
                "status": p.get("status") or "low",
                "condition": p.get("condition") or "N/A",
                "lastAssessedAt": p.get("last_assessed_at") or "",
            }
        )
    return items


def db_get_assigned_doctor_info(*, patient_user_id: str) -> dict | None:
    db = get_db()
    dp = db.doctor_patient.find_one({"_id": patient_user_id}, {"doctor_user_id": 1})
    if not dp:
        return None
    doc = db.users.find_one(
        {"_id": dp.get("doctor_user_id")},
        {"full_name": 1, "specialization": 1, "license_number": 1, "doctor_code": 1},
    )
    if not doc:
        return None
    return {
        "name": doc.get("full_name"),
        "specialty": doc.get("specialization"),
        "licenseNumber": doc.get("license_number"),
        "doctorCode": doc.get("doctor_code"),
    }


def db_find_patient_user_id_for_doctor(*, doctor_user_id: str, patient_code: str) -> str | None:
    db = get_db()
    prof = db.patient_profiles.find_one({"patient_code": patient_code}, {"_id": 1})
    if not prof:
        return None
    patient_user_id = str(prof["_id"])
    dp = db.doctor_patient.find_one({"_id": patient_user_id, "doctor_user_id": doctor_user_id}, {"_id": 1})
    return patient_user_id if dp else None


def public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "role": u["role"],
        "name": u["full_name"],
        "email": u["email"],
        "phone": u["phone"],
        "dateOfBirth": u["date_of_birth"],
        "specialization": u["specialization"],
        "licenseNumber": u["license_number"],
        "doctorCode": u.get("doctor_code"),
        "createdAt": u["created_at"],
    }


def parse_json_body(handler: BaseHTTPRequestHandler) -> dict:
    length = int(handler.headers.get("Content-Length", "0") or "0")
    raw = handler.rfile.read(length) if length else b"{}"
    try:
        return json.loads(raw.decode("utf-8") or "{}")
    except Exception:
        raise ValueError("Invalid JSON")


def get_bearer_token(handler: BaseHTTPRequestHandler) -> str | None:
    auth = handler.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        return None
    return auth.split(" ", 1)[1].strip() or None


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def compute_risk(req: dict) -> dict:
    age = int(req["age"])
    systolic = int(req["systolic"])
    diastolic = int(req["diastolic"])
    cholesterol = int(req["cholesterol"])
    blood_sugar = int(req["bloodSugar"])
    bmi = float(req["bmi"])
    smoking = req["smoking"]
    family = req["familyHistory"]
    exercise = req["exerciseLevel"]
    diet = req["dietQuality"]

    age_factor = clamp01((age - 25) / 55)
    bp_factor = clamp01(((systolic - 110) / 60 + (diastolic - 70) / 50) / 2)
    chol_factor = clamp01((cholesterol - 160) / 120)
    sugar_factor = clamp01((blood_sugar - 90) / 170)
    bmi_factor = clamp01((bmi - 22) / 18)
    smoke_factor = 1.0 if smoking == "Yes" else 0.0
    fam_factor = 1.0 if family == "Yes" else 0.0
    exercise_factor = {"Low": 1.0, "Moderate": 0.5, "High": 0.1}[exercise]
    diet_factor = {"Poor": 1.0, "Balanced": 0.5, "Excellent": 0.1}[diet]

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

    overall = int(round(clamp01(sigmoid((base - 2.2) * 2.1)) * 100))
    heart = int(round(clamp01(sigmoid((1.2 * age_factor + 1.4 * bp_factor + 1.1 * chol_factor + 0.6 * smoke_factor - 1.3) * 2.0)) * 100))
    diab = int(round(clamp01(sigmoid((1.2 * sugar_factor + 0.9 * bmi_factor + 0.4 * fam_factor + 0.3 * diet_factor - 1.2) * 2.2)) * 100))
    htn = int(round(clamp01(sigmoid((1.8 * bp_factor + 0.6 * age_factor + 0.4 * bmi_factor + 0.2 * smoke_factor - 1.05) * 2.1)) * 100))

    if overall >= 85:
        label = "critical"
    elif overall >= 70:
        label = "high"
    elif overall >= 40:
        label = "moderate"
    else:
        label = "low"
    return {
        "overallRisk": overall,
        "label": label,
        "heartDisease": heart,
        "diabetes": diab,
        "hypertension": htn,
        "generatedAt": now_iso(),
    }


# Demo in-memory data for non-auth content
PATIENTS_LOCK = threading.Lock()
PATIENTS: list[dict] = [
    {"id": "P001", "name": "John Doe", "age": 58, "gender": "Male", "lastVisit": "2026-02-05", "riskScore": 85, "status": "critical", "condition": "Heart Disease"},
    {"id": "P002", "name": "Jane Smith", "age": 62, "gender": "Female", "lastVisit": "2026-02-07", "riskScore": 78, "status": "high", "condition": "Diabetes"},
    {"id": "P003", "name": "Mike Johnson", "age": 45, "gender": "Male", "lastVisit": "2026-02-06", "riskScore": 72, "status": "high", "condition": "Hypertension"},
    {"id": "P004", "name": "Sarah Williams", "age": 55, "gender": "Female", "lastVisit": "2026-02-08", "riskScore": 68, "status": "moderate", "condition": "Stroke"},
    {"id": "P005", "name": "David Brown", "age": 42, "gender": "Male", "lastVisit": "2026-02-07", "riskScore": 35, "status": "low", "condition": "N/A"},
    {"id": "P006", "name": "Emma Wilson", "age": 38, "gender": "Female", "lastVisit": "2026-02-08", "riskScore": 28, "status": "low", "condition": "N/A"},
    {"id": "P007", "name": "Robert Taylor", "age": 67, "gender": "Male", "lastVisit": "2026-02-04", "riskScore": 82, "status": "critical", "condition": "Heart Disease"},
    {"id": "P008", "name": "Lisa Anderson", "age": 51, "gender": "Female", "lastVisit": "2026-02-08", "riskScore": 45, "status": "moderate", "condition": "Hypertension"},
    {"id": "P009", "name": "Komeza Manase", "age": 34, "gender": "Male", "lastVisit": "2026-02-17", "riskScore": 0, "status": "low", "condition": "N/A"},
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


PATIENT_DASHBOARD_TEMPLATE = {
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


HEALTH_ENTRIES_LOCK = threading.Lock()
HEALTH_ENTRIES: list[dict] = [
    {"id": "E001", "type": "Blood Pressure", "value": "120/80 mmHg", "tag": "normal", "recordedAt": "2026-02-08 08:30 AM"},
    {"id": "E002", "type": "Weight", "value": "78.2 kg", "tag": "progress", "recordedAt": "2026-02-08 07:15 AM"},
    {"id": "E003", "type": "Sleep", "value": "7.9 hours", "tag": "good", "recordedAt": "2026-02-07 11:00 PM"},
]


def require_user(handler: BaseHTTPRequestHandler) -> dict:
    token = get_bearer_token(handler)
    if not token:
        raise PermissionError("Not authenticated")
    user = db_get_user_by_token(token)
    if not user:
        raise PermissionError("Invalid token")
    return user


def require_role(handler: BaseHTTPRequestHandler, role: Role) -> dict:
    user = require_user(handler)
    if user["role"] != role:
        raise PermissionError("Forbidden")
    return user


class Handler(BaseHTTPRequestHandler):
    server_version = "MedPredictStdlib/0.1"

    def log_message(self, format: str, *args: Any) -> None:
        # quiet default logging
        return

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization,Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        path = (parsed.path or "").strip()

        if path.startswith(API_PREFIX + "/"):
            self.handle_api_get(path)
            return

        self.serve_spa_asset(path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        path = (parsed.path or "").strip()
        if not path.startswith(API_PREFIX + "/"):
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        self.handle_api_post(path)

    def handle_api_get(self, path: str) -> None:
        path = (path or "").strip().rstrip("/") or "/"
        if path == "/api/health":
            json_response(self, 200, {"ok": True, "time": now_iso()})
            return

        try:
            if path == "/api/predict/diabetes/schema":
                require_role(self, "provider")
                _proxy_ml(self, method="GET", path="/api/predict/diabetes/schema", body=None)
                return
            if path == "/api/predict/stroke/schema":
                require_role(self, "provider")
                _proxy_ml(self, method="GET", path="/api/predict/stroke/schema", body=None)
                return
            if path.startswith("/api/doctor/by-code/"):
                doctor_code = path.split("/api/doctor/by-code/", 1)[1]
                doctor = db_get_doctor_by_code(doctor_code)
                if not doctor:
                    json_response(self, 404, {"detail": "Doctor not found"})
                    return
                json_response(
                    self,
                    200,
                    {
                        "doctorCode": doctor.get("doctor_code"),
                        "name": doctor.get("full_name"),
                        "specialty": doctor.get("specialization"),
                    },
                )
                return

            if path == "/api/auth/me":
                user = require_user(self)
                json_response(self, 200, {"user": public_user(user)})
                return

            if path == "/api/provider/overview":
                doctor = require_role(self, "provider")
                items = db_get_assigned_patients(doctor_user_id=doctor["id"])

                total = len(items)
                high_risk = sum(1 for p in items if (p.get("status") in ("high", "critical")))
                today = date.today().isoformat()
                assessments_today = sum(1 for p in items if (p.get("lastAssessedAt") or "").startswith(today))
                avg_risk = int(round(sum((p.get("riskScore") or 0) for p in items) / total)) if total else 0

                top = sorted(items, key=lambda p: (p.get("riskScore") or 0), reverse=True)[:4]
                high_risk_patients = [
                    {
                        "name": p["name"],
                        "id": p["id"],
                        "age": p.get("age") or 0,
                        "condition": p.get("condition") or "N/A",
                        "risk": p.get("riskScore") or 0,
                        "tag": p.get("status") or "low",
                    }
                    for p in top
                    if (p.get("riskScore") or 0) > 0
                ]

                recent = sorted(items, key=lambda p: (p.get("lastAssessedAt") or ""), reverse=True)[:4]
                recent_assessments = [
                    {
                        "name": p["name"],
                        "timeAgo": "recently",
                        "level": "High Risk"
                        if (p.get("status") in ("high", "critical"))
                        else ("Moderate Risk" if p.get("status") == "moderate" else "Low Risk"),
                    }
                    for p in recent
                    if p.get("lastAssessedAt")
                ]

                json_response(
                    self,
                    200,
                    {
                        "totalPatients": total,
                        "highRisk": high_risk,
                        "assessmentsToday": assessments_today,
                        "avgRiskScore": avg_risk,
                        "highRiskPatients": high_risk_patients,
                        "recentAssessments": recent_assessments,
                        "systemAlerts": PROVIDER_OVERVIEW["systemAlerts"],
                    },
                )
                return

            if path == "/api/provider/patients":
                doctor = require_role(self, "provider")
                items = db_get_assigned_patients(doctor_user_id=doctor["id"])
                json_response(self, 200, {"items": items})
                return

            if path == "/api/provider/invite-code":
                doctor = require_role(self, "provider")
                code = _ensure_doctor_code(doctor["id"])
                json_response(self, 200, {"doctorCode": code})
                return

            if path == "/api/provider/analytics":
                require_role(self, "provider")
                json_response(
                    self,
                    200,
                    {
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
                    },
                )
                return

            if path == "/api/patient/dashboard":
                user = require_role(self, "patient")
                payload = dict(PATIENT_DASHBOARD_TEMPLATE)
                payload["user"] = {"name": user["full_name"], "role": user["role"]}
                payload["doctor"] = db_get_assigned_doctor_info(patient_user_id=user["id"])
                json_response(self, 200, payload)
                return

            if path == "/api/patient/health-entries":
                user = require_role(self, "patient")
                db = get_db()
                docs = list(
                    db.health_entries.find(
                        {"patient_user_id": user["id"]},
                        {"_id": 1, "type": 1, "value": 1, "tag": 1, "recordedAt": 1, "created_at": 1},
                    ).sort("created_at", -1)
                )
                items = [
                    {
                        "id": str(d.get("_id")),
                        "type": d.get("type") or "Entry",
                        "value": d.get("value") or "",
                        "tag": d.get("tag") or "logged",
                        "recordedAt": d.get("recordedAt") or "",
                    }
                    for d in docs
                ]
                json_response(self, 200, {"items": items})
                return

            if path == "/api/patient/trends":
                require_role(self, "patient")
                json_response(
                    self,
                    200,
                    {
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
                    },
                )
                return

        except PermissionError as e:
            json_response(self, 401, {"detail": str(e)})
            return

        json_response(self, 404, {"detail": "Not found"})

    def handle_api_post(self, path: str) -> None:
        try:
            body = parse_json_body(self)
        except ValueError:
            json_response(self, 400, {"detail": "Invalid JSON"})
            return

        if path == "/api/auth/signup":
            role: Role = body.get("role")
            full_name = (body.get("fullName") or "").strip()
            email = (body.get("email") or "").strip().lower()
            phone = body.get("phone")
            password = body.get("password") or ""
            confirm = body.get("confirmPassword") or ""

            if role not in ("patient", "provider"):
                json_response(self, 400, {"detail": "Invalid role"})
                return
            if len(full_name) < 2 or "@" not in email:
                json_response(self, 400, {"detail": "Invalid name/email"})
                return
            if len(password) < 6:
                json_response(self, 400, {"detail": "Password must be at least 6 characters"})
                return
            if password != confirm:
                json_response(self, 400, {"detail": "Passwords do not match"})
                return

            dob = body.get("dateOfBirth") if role == "patient" else None
            specialization = body.get("specialization") if role == "provider" else None
            license_number = body.get("licenseNumber") if role == "provider" else None
            doctor_code_input = body.get("doctorCode") if role == "patient" else None
            gender = body.get("gender") if role == "patient" else None
            if role == "provider" and (not specialization or not license_number):
                json_response(self, 400, {"detail": "Specialization and license number are required for providers"})
                return
            if role == "patient" and not doctor_code_input:
                json_response(self, 400, {"detail": "Doctor code is required for patients"})
                return

            db = get_db()
            if db.users.find_one({"email": email}, {"_id": 1}):
                json_response(self, 409, {"detail": "Email already registered"})
                return

            doctor = None
            if role == "patient":
                doctor = db_get_doctor_by_code(str(doctor_code_input))
                if not doctor:
                    json_response(self, 400, {"detail": "Invalid doctor code"})
                    return

            user_id = secrets.token_hex(16)
            try:
                db.users.insert_one(
                    {
                        "_id": user_id,
                        "role": role,
                        "full_name": full_name,
                        "email": email,
                        "phone": phone,
                        "date_of_birth": dob,
                        "specialization": specialization,
                        "license_number": license_number,
                        "doctor_code": None,
                        "password_hash": pbkdf2_hash_password(password),
                        "created_at": now_iso(),
                    }
                )
            except DuplicateKeyError:
                json_response(self, 409, {"detail": "Email already registered"})
                return
            except PyMongoError:
                json_response(self, 500, {"detail": "Database error"})
                return

            if role == "provider":
                _ensure_doctor_code(user_id)
            if role == "patient":
                _ensure_patient_profile(user_id, gender=gender)
                try:
                    db_assign_patient_to_doctor(patient_user_id=user_id, doctor_user_id=doctor["id"])
                except ValueError:
                    json_response(self, 409, {"detail": "Patient already assigned to a doctor"})
                    return

            token = db_issue_token(user_id)
            user = db_get_user_by_id(user_id)

            json_response(self, 200, {"token": token, "user": public_user(user)})
            return

        if path == "/api/auth/login":
            role: Role = body.get("role")
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            doctor_code_input = body.get("doctorCode") if role == "patient" else None
            if role not in ("patient", "provider"):
                json_response(self, 400, {"detail": "Invalid role"})
                return
            user = db_get_user_by_email(email)
            if not user or user["role"] != role:
                json_response(self, 401, {"detail": "Invalid email/password"})
                return
            if not pbkdf2_verify_password(password, user["password_hash"]):
                json_response(self, 401, {"detail": "Invalid email/password"})
                return
            if role == "provider":
                _ensure_doctor_code(user["id"])
            if role == "patient":
                _ensure_patient_profile(user["id"])
                doctor_id = db_get_doctor_for_patient(user["id"])
                if not doctor_id:
                    if doctor_code_input:
                        doctor = db_get_doctor_by_code(str(doctor_code_input))
                        if not doctor:
                            json_response(self, 400, {"detail": "Invalid doctor code"})
                            return
                        try:
                            db_assign_patient_to_doctor(patient_user_id=user["id"], doctor_user_id=doctor["id"])
                        except ValueError:
                            pass
                    else:
                        json_response(self, 409, {"detail": "Patient not assigned to a doctor. Provide doctorCode to link."})
                        return
            token = db_issue_token(user["id"])
            json_response(self, 200, {"token": token, "user": public_user(user)})
            return

        try:
            if path == "/api/predict/diabetes":
                provider = require_role(self, "provider")
                _proxy_ml(
                    self,
                    method="POST",
                    path="/api/predict/diabetes",
                    body=body,
                    log_doc={"provider_user_id": provider["id"], "model": "diabetes", "features": body},
                )
                return
            if path == "/api/predict/stroke":
                provider = require_role(self, "provider")
                _proxy_ml(
                    self,
                    method="POST",
                    path="/api/predict/stroke",
                    body=body,
                    log_doc={"provider_user_id": provider["id"], "model": "stroke", "features": body},
                )
                return
            if path == "/api/provider/patients":
                json_response(self, 400, {"detail": "Patients must sign up using your doctor code, or assign by email via /api/provider/assign"})
                return

            if path == "/api/provider/assign":
                doctor = require_role(self, "provider")
                patient_email = (body.get("patientEmail") or "").strip().lower()
                if "@" not in patient_email:
                    json_response(self, 400, {"detail": "patientEmail is required"})
                    return
                patient = db_get_user_by_email(patient_email)
                if not patient or patient["role"] != "patient":
                    json_response(self, 404, {"detail": "Patient not found"})
                    return
                if db_get_doctor_for_patient(patient["id"]):
                    json_response(self, 409, {"detail": "Patient already assigned to a doctor"})
                    return
                _ensure_patient_profile(patient["id"])
                try:
                    db_assign_patient_to_doctor(patient_user_id=patient["id"], doctor_user_id=doctor["id"])
                except ValueError:
                    json_response(self, 409, {"detail": "Patient already assigned to a doctor"})
                    return
                json_response(self, 200, {"ok": True})
                return

            if path == "/api/provider/assess":
                doctor = require_role(self, "provider")
                result = compute_risk(body)
                pid = body.get("patientId")
                if not pid:
                    json_response(self, 400, {"detail": "patientId is required"})
                    return
                patient_user_id = db_find_patient_user_id_for_doctor(doctor_user_id=doctor["id"], patient_code=str(pid))
                if not patient_user_id:
                    json_response(self, 404, {"detail": "Patient not found for this doctor"})
                    return
                _ensure_patient_profile(patient_user_id)
                best = max(
                    [("Heart Disease", result["heartDisease"]), ("Diabetes", result["diabetes"]), ("Hypertension", result["hypertension"])],
                    key=lambda x: x[1],
                )[0]
                db = get_db()
                try:
                    db.patient_profiles.update_one(
                        {"_id": patient_user_id},
                        {
                            "$set": {
                                "risk_score": int(result["overallRisk"]),
                                "status": result["label"],
                                "condition": best,
                                "last_visit": date.today().isoformat(),
                                "last_assessed_at": now_iso(),
                                "last_assessment_json": json.dumps(result),
                            }
                        },
                    )
                    db.risk_assessments.insert_one(
                        {
                            "patient_user_id": patient_user_id,
                            "patient_code": str(pid),
                            "provider_user_id": doctor["id"],
                            "created_at": now_iso(),
                            "result": result,
                            "condition": best,
                            "status": result["label"],
                            "overall_risk": int(result["overallRisk"]),
                        }
                    )
                except PyMongoError:
                    json_response(self, 500, {"detail": "Database error"})
                    return
                json_response(self, 200, result)
                return

            if path == "/api/patient/health-entries":
                user = require_role(self, "patient")
                entry_id = "E" + secrets.token_hex(8).upper()
                doc = {
                    "_id": entry_id,
                    "patient_user_id": user["id"],
                    "created_at": now_iso(),
                    "type": "Custom Entry",
                    "value": f"BP {body.get('systolic')}/{body.get('diastolic')}, HR {body.get('heartRate')}, Sugar {body.get('bloodSugar')}",
                    "tag": "logged",
                    "recordedAt": datetime.now().strftime("%Y-%m-%d %I:%M %p"),
                    "raw": body,
                }
                db = get_db()
                try:
                    db.health_entries.insert_one(doc)
                except DuplicateKeyError:
                    # Very unlikely; retry once with a fresh ID.
                    entry_id = "E" + secrets.token_hex(8).upper()
                    doc["_id"] = entry_id
                    db.health_entries.insert_one(doc)
                except PyMongoError:
                    json_response(self, 500, {"detail": "Database error"})
                    return
                json_response(self, 200, {"ok": True, "id": entry_id})
                return

            if path == "/api/patient/assistant/chat":
                require_role(self, "patient")
                msg = (body.get("message") or "").strip().lower()
                if "sleep" in msg:
                    answer = "For better sleep quality: keep a consistent schedule, limit caffeine after midday, and avoid screens 30–60 minutes before bed. If your average stays below 7 hours, aim to add 15–30 minutes this week."
                elif "diabetes" in msg or "blood sugar" in msg:
                    answer = "To reduce diabetes risk: prioritize high-fiber meals (vegetables, legumes, whole grains), reduce sugary drinks, and aim for 150 minutes/week of moderate exercise. Keeping BMI and fasting glucose in range helps most."
                elif "exercise" in msg:
                    answer = "A simple plan: 30 minutes brisk walking 5 days/week + 2 days of light strength training. If you're new, start with 10–15 minutes and increase gradually."
                else:
                    answer = "I can help interpret your trends and suggest habits. Tell me what you want to improve (blood pressure, sleep, weight, blood sugar), and I’ll suggest a simple next step."
                json_response(self, 200, {"answer": answer, "generatedAt": now_iso()})
                return
        except PermissionError as e:
            json_response(self, 401, {"detail": str(e)})
            return
        except Exception:
            json_response(self, 400, {"detail": "Bad request"})
            return

        json_response(self, 404, {"detail": "Not found"})

    def serve_spa_asset(self, path: str) -> None:
        if not DIST_DIR.exists():
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            msg = "Frontend not built. Run: cd frontend && npm install && npm run build\n"
            raw = msg.encode("utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
            return

        clean = (path or "/").lstrip("/")
        if clean == "":
            file_response(self, DIST_DIR / "index.html")
            return

        candidate = (DIST_DIR / clean).resolve()
        try:
            candidate.relative_to(DIST_DIR.resolve())
        except ValueError:
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        if candidate.exists() and candidate.is_file():
            file_response(self, candidate)
            return

        # SPA fallback for React Router
        file_response(self, DIST_DIR / "index.html")


def main() -> None:
    init_mongo()
    server = ThreadingHTTPServer(("127.0.0.1", 8000), Handler)
    print("MedPredict running on http://localhost:8000", flush=True)
    print("API health: http://localhost:8000/api/health", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()

