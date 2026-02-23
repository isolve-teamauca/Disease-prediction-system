from __future__ import annotations

import os
import pickle
from pathlib import Path
from typing import Any, Literal

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = Path(os.getenv("MODELS_DIR", str(ROOT / "models")))


def _load_pickle(path: Path) -> Any:
    if not path.exists():
        raise FileNotFoundError(str(path))
    with path.open("rb") as f:
        return pickle.load(f)


def _feature_order_from(*objs: Any) -> list[str] | None:
    for o in objs:
        names = getattr(o, "feature_names_in_", None)
        if names is not None:
            return [str(x) for x in list(names)]
    return None


def _as_row(features: dict[str, Any], order: list[str]) -> np.ndarray:
    missing = [k for k in order if k not in features]
    if missing:
        raise ValueError(f"Missing features: {', '.join(missing[:8])}" + ("..." if len(missing) > 8 else ""))
    row = []
    for k in order:
        v = features.get(k)
        if v is None or v == "":
            row.append(np.nan)
        else:
            row.append(v)
    return np.array(row, dtype=float).reshape(1, -1)


def _predict_proba(model: Any, X: Any) -> float | None:
    if hasattr(model, "predict_proba"):
        p = model.predict_proba(X)
        try:
            return float(p[0][1])
        except Exception:
            return float(p[0])
    return None


def _label_from_prob(prob: float, *, threshold: float = 0.5) -> Literal["Low Risk", "High Risk"]:
    return "High Risk" if prob >= threshold else "Low Risk"


class PredictRequest(BaseModel):
    # Prefer sending named features
    features: dict[str, Any] | None = None
    # Or send ordered array
    values: list[float] | None = None


class PredictResponse(BaseModel):
    model: Literal["diabetes", "stroke"]
    label: Literal["Low Risk", "High Risk"]
    probability: float | None = None


class SchemaResponse(BaseModel):
    model: Literal["diabetes", "stroke"]
    featureOrder: list[str]
    features: list[dict] = Field(default_factory=list)


class _Artifacts:
    diabetes_model: Any | None = None
    diabetes_scaler: Any | None = None

    stroke_model: Any | None = None
    stroke_scaler: Any | None = None
    stroke_encoders: Any | None = None


ART = _Artifacts()


def load_artifacts() -> None:
    try:
        ART.diabetes_model = _load_pickle(MODELS_DIR / "diabetes_model.pkl")
        ART.diabetes_scaler = _load_pickle(MODELS_DIR / "diabetes_scaler.pkl")
    except FileNotFoundError:
        ART.diabetes_model = None
        ART.diabetes_scaler = None

    try:
        ART.stroke_model = _load_pickle(MODELS_DIR / "stroke_model.pkl")
        ART.stroke_scaler = _load_pickle(MODELS_DIR / "stroke_scaler.pkl")
        ART.stroke_encoders = _load_pickle(MODELS_DIR / "stroke_encoders.pkl")
    except FileNotFoundError:
        ART.stroke_model = None
        ART.stroke_scaler = None
        ART.stroke_encoders = None


def _ensure_diabetes() -> tuple[Any, Any, list[str]]:
    if not ART.diabetes_model or not ART.diabetes_scaler:
        raise HTTPException(status_code=500, detail="Diabetes model files missing. Put them in backend/models/")
    order = _feature_order_from(ART.diabetes_scaler, ART.diabetes_model)
    if not order:
        # fallback: allow array input only
        n = getattr(ART.diabetes_scaler, "n_features_in_", None)
        if not n:
            raise HTTPException(status_code=500, detail="Cannot determine diabetes feature order")
        order = [f"f{i}" for i in range(int(n))]
    return ART.diabetes_model, ART.diabetes_scaler, order


def _ensure_stroke() -> tuple[Any, Any, Any, list[str]]:
    if not ART.stroke_model or not ART.stroke_scaler or ART.stroke_encoders is None:
        raise HTTPException(status_code=500, detail="Stroke model files missing. Put them in backend/models/")
    order = _feature_order_from(ART.stroke_scaler, ART.stroke_model)
    if not order:
        n = getattr(ART.stroke_scaler, "n_features_in_", None)
        if not n:
            raise HTTPException(status_code=500, detail="Cannot determine stroke feature order")
        order = [f"f{i}" for i in range(int(n))]
    return ART.stroke_model, ART.stroke_scaler, ART.stroke_encoders, order


def _encode_stroke_features(features: dict[str, Any], encoders: Any) -> dict[str, Any]:
    # Best-effort: support encoders as dict[col] -> encoder with transform([value]) -> [num]
    if not isinstance(encoders, dict):
        return features
    out = dict(features)
    for col, enc in encoders.items():
        if col not in out:
            continue
        v = out[col]
        try:
            transformed = enc.transform([v])
            arr = np.array(transformed)
            if arr.ndim == 2 and arr.shape[1] == 1:
                out[col] = float(arr[0][0])
            elif arr.ndim == 1:
                out[col] = float(arr[0])
            else:
                # One-hot or multi-d output: keep as-is and let caller handle
                out[col] = transformed
        except Exception:
            # If encoder fails, keep original value
            out[col] = v
    return out


def _vectorize(features: dict[str, Any], order: list[str]) -> np.ndarray:
    # If any encoded value is a multi-d array (e.g., one-hot), this generic vectorizer can't expand reliably.
    for k, v in features.items():
        if hasattr(v, "shape") and np.array(v).ndim > 1:
            raise ValueError(f"Feature '{k}' encoding produced multiple values; please ensure your model/scaler expects a single numeric value per feature.")
    return _as_row(features, order)


app = FastAPI(title="MedPredict ML Service", version="0.1.0")


@app.on_event("startup")
def _startup() -> None:
    load_artifacts()


@app.get("/api/predict/diabetes/schema", response_model=SchemaResponse)
def diabetes_schema():
    _, _, order = _ensure_diabetes()
    return {
        "model": "diabetes",
        "featureOrder": order,
        "features": [{"name": n, "kind": "number", "required": True} for n in order],
    }


@app.get("/api/predict/stroke/schema", response_model=SchemaResponse)
def stroke_schema():
    _, _, encoders, order = _ensure_stroke()
    features: list[dict] = []
    enc_map = encoders if isinstance(encoders, dict) else {}
    for n in order:
        enc = enc_map.get(n)
        if enc is not None and hasattr(enc, "classes_"):
            try:
                opts = [str(x) for x in list(enc.classes_)]
            except Exception:
                opts = []
            features.append({"name": n, "kind": "category", "required": True, "options": opts})
        else:
            features.append({"name": n, "kind": "number", "required": True})
    return {"model": "stroke", "featureOrder": order, "features": features}


@app.post("/api/predict/diabetes", response_model=PredictResponse)
def predict_diabetes(req: PredictRequest):
    model, scaler, order = _ensure_diabetes()
    try:
        if req.features is not None:
            X = _as_row(req.features, order)
        elif req.values is not None:
            X = np.array(req.values, dtype=float).reshape(1, -1)
        else:
            raise ValueError("Provide 'features' or 'values'")
        Xs = scaler.transform(X)
        prob = _predict_proba(model, Xs)
        if prob is None:
            pred = int(model.predict(Xs)[0])
            prob = float(pred)
        return {"model": "diabetes", "label": _label_from_prob(prob), "probability": float(prob)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid input for diabetes prediction")


@app.post("/api/predict/stroke", response_model=PredictResponse)
def predict_stroke(req: PredictRequest):
    model, scaler, encoders, order = _ensure_stroke()
    try:
        if req.features is not None:
            feats = _encode_stroke_features(req.features, encoders)
            X = _vectorize(feats, order)
        elif req.values is not None:
            X = np.array(req.values, dtype=float).reshape(1, -1)
        else:
            raise ValueError("Provide 'features' or 'values'")
        Xs = scaler.transform(X)
        prob = _predict_proba(model, Xs)
        if prob is None:
            pred = int(model.predict(Xs)[0])
            prob = float(pred)
        return {"model": "stroke", "label": _label_from_prob(prob), "probability": float(prob)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid input for stroke prediction")

