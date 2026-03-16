"""
Test script for all 4 disease pipelines.
Loads each .pkl via get_model(), runs a sample input through predict_disease(), prints results.

Run from backend/ (with venv activated and pandas installed):
  python ml_models/test_pipeline.py

Do not run as python -m ml_models.test_pipeline (Django must be configured before ml_models is imported).
"""
import os
import sys

# Configure Django before any ml_models import (model_loader uses settings at import time)
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from ml_models.predictor import predict_disease, FEATURE_ORDER, SUPPORTED_DISEASES

# Sample input dict per disease (numeric values only; must match FEATURE_ORDER)
SAMPLE_INPUTS = {
    "heart": {
        "age": 52,
        "sex": 1,
        "cp": 0,
        "trestbps": 125,
        "chol": 212,
        "fbs": 0,
        "restecg": 1,
        "thalach": 168,
        "exang": 0,
        "oldpeak": 1.0,
        "slope": 2,
        "ca": 2,
        "thal": 3,
    },
    "hypertension": {
        "age": 55,
        "sex": 1,
        "cp": 2,
        "trestbps": 140,
        "chol": 220,
        "fbs": 1,
        "restecg": 0,
        "thalach": 145,
        "exang": 0,
        "oldpeak": 0.5,
        "slope": 1,
        "ca": 0,
        "thal": 2,
    },
    "diabetes": {
        "pregnancies": 2,
        "glucose": 120,
        "blood_pressure": 70,
        "skin_thickness": 25,
        "insulin": 100,
        "bmi": 26.5,
        "diabetes_pedigree_function": 0.5,
        "age": 35,
    },
    "stroke": {
        "gender": 1,
        "age": 45,
        "hypertension": 0,
        "heart_disease": 0,
        "ever_married": 1,
        "work_type": 2,
        "residence_type": 1,
        "avg_glucose_level": 95.0,
        "bmi": 24.0,
        "smoking_status": 1,
    },
}


def main():
    print("Testing disease pipelines (get_model + predict_disease)\n")
    errors = []

    for disease in SUPPORTED_DISEASES:
        print(f"--- {disease.upper()} ---")
        sample = SAMPLE_INPUTS.get(disease)
        if not sample:
            msg = f"No sample input for {disease}. Add to SAMPLE_INPUTS."
            print(f"  SKIP: {msg}\n")
            errors.append((disease, msg))
            continue

        try:
            result = predict_disease(disease, sample)
            print(f"  prediction:  {result['prediction']}")
            print(f"  probability: {result['probability']}")
            print(f"  risk_level:  {result['risk_level']}")
            print()
        except FileNotFoundError as e:
            msg = f"Model file missing: {e}"
            print(f"  ERROR: {msg}\n")
            errors.append((disease, msg))
        except ValueError as e:
            msg = f"Validation/feature error: {e}"
            print(f"  ERROR: {msg}\n")
            errors.append((disease, msg))
        except Exception as e:
            msg = f"Preprocessing or pipeline error: {type(e).__name__}: {e}"
            print(f"  ERROR: {msg}\n")
            errors.append((disease, msg))

    if errors:
        print("Summary of errors:")
        for d, m in errors:
            print(f"  {d}: {m}")
        sys.exit(1)
    print("All pipelines ran successfully.")


if __name__ == "__main__":
    main()
