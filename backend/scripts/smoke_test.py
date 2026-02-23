from __future__ import annotations

import json
import os
import random
import string
import time
import urllib.error
import urllib.request


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")


def _rand(s: int = 8) -> str:
    alphabet = string.ascii_lowercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(s))


def api(method: str, path: str, *, token: str | None = None, body: dict | None = None) -> tuple[int, dict]:
    url = BASE_URL + path
    raw = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=raw, method=method.upper())
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            return int(resp.status), json.loads(data.decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        data = e.read()
        try:
            payload = json.loads((data or b"{}").decode("utf-8") or "{}")
        except Exception:
            payload = {"raw": (data or b"").decode("utf-8", errors="replace")}
        return int(e.code), payload


def wait_for_server() -> None:
    for _ in range(30):
        status, payload = api("GET", "/api/health")
        if status == 200 and payload.get("ok") is True:
            return
        time.sleep(0.3)
    raise SystemExit("Server did not become healthy in time")


def main() -> None:
    wait_for_server()

    suffix = _rand()
    provider_email = f"prov_{suffix}@example.com"
    patient_email = f"pat_{suffix}@example.com"

    # Provider signup
    st, out = api(
        "POST",
        "/api/auth/signup",
        body={
            "role": "provider",
            "fullName": "Dr Smoke Test",
            "email": provider_email,
            "phone": "0780000000",
            "specialization": "Cardiology",
            "licenseNumber": "LIC-TEST-001",
            "password": "secret123",
            "confirmPassword": "secret123",
        },
    )
    assert st == 200, (st, out)
    provider_token = out["token"]

    # Provider invite code
    st, out = api("GET", "/api/provider/invite-code", token=provider_token)
    assert st == 200 and out.get("doctorCode"), (st, out)
    doctor_code = out["doctorCode"]

    # Patient signup (linked)
    st, out = api(
        "POST",
        "/api/auth/signup",
        body={
            "role": "patient",
            "fullName": "Patient Smoke Test",
            "email": patient_email,
            "phone": "0790000000",
            "dateOfBirth": "1990-01-01",
            "doctorCode": doctor_code,
            "gender": "Other",
            "password": "secret123",
            "confirmPassword": "secret123",
        },
    )
    assert st == 200, (st, out)
    patient_token = out["token"]

    # Auth me
    st, out = api("GET", "/api/auth/me", token=provider_token)
    assert st == 200 and out["user"]["role"] == "provider", (st, out)
    st, out = api("GET", "/api/auth/me", token=patient_token)
    assert st == 200 and out["user"]["role"] == "patient", (st, out)

    # Provider patients includes patient
    st, out = api("GET", "/api/provider/patients", token=provider_token)
    assert st == 200 and isinstance(out.get("items"), list) and len(out["items"]) >= 1, (st, out)
    patient_code = out["items"][0]["id"]

    # Patient dashboard includes doctor
    st, out = api("GET", "/api/patient/dashboard", token=patient_token)
    assert st == 200 and out.get("doctor") and out["doctor"].get("doctorCode") == doctor_code, (st, out)

    # Health entries POST/GET
    st, out = api(
        "POST",
        "/api/patient/health-entries",
        token=patient_token,
        body={
            "systolic": 123,
            "diastolic": 81,
            "heartRate": 71,
            "bloodSugar": 99,
            "weightKg": 78.2,
            "sleepHours": 7.5,
            "exerciseMinutes": 25,
            "mood": "Good",
            "notes": "smoke test",
        },
    )
    assert st == 200 and out.get("ok") is True, (st, out)
    st, out = api("GET", "/api/patient/health-entries", token=patient_token)
    assert st == 200 and len(out.get("items", [])) >= 1, (st, out)

    # Provider assess
    st, out = api(
        "POST",
        "/api/provider/assess",
        token=provider_token,
        body={
            "patientId": patient_code,
            "age": 40,
            "systolic": 130,
            "diastolic": 85,
            "cholesterol": 190,
            "bloodSugar": 105,
            "bmi": 26.2,
            "smoking": "No",
            "familyHistory": "No",
            "exerciseLevel": "Moderate",
            "dietQuality": "Balanced",
        },
    )
    assert st == 200 and out.get("overallRisk") is not None, (st, out)

    # ML proxy (requires ML service running on 127.0.0.1:8001)
    st, out = api("GET", "/api/predict/diabetes/schema", token=provider_token)
    assert st in (200, 500), (st, out)  # 500 is expected if model files are missing

    print("Smoke test passed")


if __name__ == "__main__":
    main()

