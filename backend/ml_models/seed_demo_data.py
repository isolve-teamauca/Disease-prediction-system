"""
Seed demo data for live competition presentations.
Creates demo_patient / demo123, demo_provider / demo123, and 10 sample predictions for the patient.
Run from backend/: python ml_models/seed_demo_data.py
"""
import os
import random
import sys

# Configure Django before importing apps
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from django.contrib.auth import get_user_model
from apps.patients.models import Patient
from apps.predictions.models import Prediction

User = get_user_model()

# Realistic clinical ranges (min, max) per feature for random sampling
HEART_RANGES = {
    "age": (35, 75),
    "sex": (0, 1),
    "cp": (0, 3),
    "trestbps": (110, 180),
    "chol": (150, 350),
    "fbs": (0, 1),
    "restecg": (0, 2),
    "thalach": (90, 180),
    "exang": (0, 1),
    "oldpeak": (0.0, 4.0),
    "slope": (0, 2),
    "ca": (0, 3),
    "thal": (0, 3),
}
DIABETES_RANGES = {
    "pregnancies": (0, 15),
    "glucose": (70, 200),
    "blood_pressure": (60, 110),
    "skin_thickness": (10, 60),
    "insulin": (0, 300),
    "bmi": (18.0, 45.0),
    "diabetes_pedigree_function": (0.1, 2.5),
    "age": (21, 80),
}
STROKE_RANGES = {
    "gender": (0, 1),
    "age": (25, 85),
    "hypertension": (0, 1),
    "heart_disease": (0, 1),
    "ever_married": (0, 1),
    "work_type": (0, 4),
    "residence_type": (0, 1),
    "avg_glucose_level": (80.0, 250.0),
    "bmi": (18.0, 45.0),
    "smoking_status": (0, 3),
}
DISEASE_RANGES = {
    "heart": HEART_RANGES,
    "hypertension": HEART_RANGES,
    "diabetes": DIABETES_RANGES,
    "stroke": STROKE_RANGES,
}


def random_features(disease):
    """Generate a dict of random features within realistic medical ranges."""
    ranges = DISEASE_RANGES.get(disease, {})
    features = {}
    for name, (lo, hi) in ranges.items():
        if isinstance(lo, int) and isinstance(hi, int):
            features[name] = random.randint(lo, hi)
        else:
            features[name] = round(random.uniform(lo, hi), 2)
    return features


def main():
    print("Seeding demo data...")

    # 1. Create or get demo users
    patient_user, _ = User.objects.get_or_create(
        username="demo_patient",
        defaults={
            "email": "demo_patient@demo.test",
            "role": User.Role.PATIENT,
            "full_name": "Demo Patient",
        },
    )
    patient_user.set_password("demo123")
    patient_user.save()
    print("  Demo patient: demo_patient / demo123")

    provider_user, _ = User.objects.get_or_create(
        username="demo_provider",
        defaults={
            "email": "demo_provider@demo.test",
            "role": User.Role.PROVIDER,
            "full_name": "Demo Provider",
        },
    )
    provider_user.set_password("demo123")
    provider_user.save()
    print("  Demo provider: demo_provider / demo123")

    # 2. Ensure patient profile exists
    patient, _ = Patient.objects.get_or_create(user=patient_user)
    print(f"  Patient profile id: {patient.id}")

    # 3. Try to use real predictor; fallback to random outcome if model missing
    try:
        from ml_models.predictor import predict_disease
        use_predictor = True
    except Exception:
        use_predictor = False

    # 4. Clear existing demo patient predictions so re-runs give exactly 10
    Prediction.objects.filter(patient=patient).delete()

    # 5. Generate 10 predictions across all 4 diseases (3 heart, 2 diabetes, 3 hypertension, 2 stroke)
    diseases = ["heart", "diabetes", "hypertension", "stroke"]
    counts = [3, 2, 3, 2]
    created = 0
    for disease, n in zip(diseases, counts):
        for _ in range(n):
            features = random_features(disease)
            if use_predictor:
                try:
                    result = predict_disease(disease, features)
                    prediction = result["prediction"]
                    probability = result["probability"]
                    risk_level = result["risk_level"]
                except Exception:
                    probability = round(random.uniform(0.1, 0.85), 4)
                    prediction = 1 if probability >= 0.5 else 0
                    risk_level = "Low" if probability <= 0.33 else "Moderate" if probability <= 0.66 else "High"
            else:
                probability = round(random.uniform(0.1, 0.85), 4)
                prediction = 1 if probability >= 0.5 else 0
                risk_level = "Low" if probability <= 0.33 else "Moderate" if probability <= 0.66 else "High"

            Prediction.objects.create(
                patient=patient,
                disease_type=disease,
                prediction=prediction,
                probability=probability,
                risk_level=risk_level,
            )
            created += 1

    print(f"  Created {created} sample predictions for demo patient.")

    # 6. Print patient code for demos
    print()
    print("=" * 50)
    print("DEMO PATIENT CODE (for provider search):", patient.id)
    print("=" * 50)
    print("  Login as patient:  demo_patient / demo123")
    print("  Login as provider: demo_provider / demo123")
    print()


if __name__ == "__main__":
    main()