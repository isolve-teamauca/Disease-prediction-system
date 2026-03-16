"""
Inference for disease prediction using sklearn Pipelines only.
Each disease has one Pipeline .pkl (ColumnTransformer + StandardScaler + Model).
No manual scaling, no encoder/scaler loading.
"""
import logging

import pandas as pd

from .model_loader import get_model, DISEASE_MODEL_FILENAMES

logger = logging.getLogger(__name__)

SUPPORTED_DISEASES = list(DISEASE_MODEL_FILENAMES.keys())

# Feature order per disease; must match training DataFrame columns.
FEATURE_ORDER = {
    "heart": [
        "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
        "thalach", "exang", "oldpeak", "slope", "ca", "thal",
    ],
    "hypertension": [
        "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
        "thalach", "exang", "oldpeak", "slope", "ca", "thal",
    ],
    "diabetes": [
        "pregnancies", "glucose", "blood_pressure", "skin_thickness",
        "insulin", "bmi", "diabetes_pedigree_function", "age",
    ],
    "stroke": [
        "gender", "age", "hypertension", "heart_disease", "ever_married",
        "work_type", "residence_type", "avg_glucose_level", "bmi", "smoking_status",
    ],
}

# 0-30% Low, 31-60% Moderate, 61-80% High, 81-100% Critical
RISK_LEVELS = ("Low", "Moderate", "High", "Critical")
RISK_BANDS = (
    (0.30, "Low", "green", "Routine checkup recommended"),
    (0.60, "Moderate", "orange", "Lifestyle changes advised"),
    (0.80, "High", "red", "Consult a specialist soon"),
    (1.00, "Critical", "darkred", "Immediate medical attention"),
)


def _probability_to_risk_assessment(probability: float) -> dict:
    """Return { risk_level, color, advice } for the given probability (0-1)."""
    p = max(0.0, min(1.0, float(probability)))
    for max_pct, level, color, advice in RISK_BANDS:
        if p <= max_pct:
            return {"risk_level": level, "color": color, "advice": advice}
    return {"risk_level": "Critical", "color": "darkred", "advice": "Immediate medical attention"}


def _validate_features(disease: str, features: dict) -> None:
    if not isinstance(features, dict):
        raise ValueError("features must be a dict of feature name -> numeric value")
    order = FEATURE_ORDER.get(disease)
    if not order:
        raise ValueError(f"Unknown disease: {disease}. Supported: {SUPPORTED_DISEASES}")
    missing = [n for n in order if n not in features]
    if missing:
        raise ValueError(f"Missing required features for {disease}: {missing}")
    for name in order:
        val = features[name]
        if val is None:
            raise ValueError(f"Feature '{name}' must be numeric, got None")
        try:
            float(val)
        except (TypeError, ValueError):
            raise ValueError(f"Feature '{name}' must be numeric, got {type(val).__name__}: {repr(val)}")


def _features_to_dataframe(disease: str, features: dict) -> pd.DataFrame:
    """Build a single-row DataFrame with columns in FEATURE_ORDER[disease]."""
    order = FEATURE_ORDER[disease]
    row = [float(features[name]) for name in order]
    return pd.DataFrame([row], columns=order)


def predict_disease(disease: str, features: dict):
    """
    Run inference using the disease Pipeline only.
    model = get_model(disease); prediction = model.predict(input_df); probability from model.predict_proba(input_df).
    """
    disease = disease.lower().strip()
    if disease not in SUPPORTED_DISEASES:
        raise ValueError(f"Unsupported disease: {disease}. Supported: {SUPPORTED_DISEASES}")

    _validate_features(disease, features)
    input_df = _features_to_dataframe(disease, features)
    model = get_model(disease)

    prediction = model.predict(input_df)
    pred_label = int(prediction[0])

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(input_df)[0]
        if proba.ndim == 1 and len(proba) >= 2:
            probability = float(proba[1])
        else:
            probability = float(proba[0]) if pred_label == 1 else 1.0 - float(proba[0])
    else:
        probability = 1.0 if pred_label == 1 else 0.0

    risk_assessment = _probability_to_risk_assessment(probability)

    return {
        "prediction": pred_label,
        "probability": round(probability, 4),
        "risk_level": risk_assessment["risk_level"],
        "risk_color": risk_assessment["color"],
        "risk_advice": risk_assessment["advice"],
    }
