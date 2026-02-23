"""
Django test: provider predict flow using APIClient.
- Log in as provider (session), POST /api/predict/heart/ with features + patient_id -> 201 + prediction/probability/risk_level.
- POST without patient_id -> 400.
Run from backend: python manage.py test tests.test_provider_predict
Requires backend venv with pandas/sklearn (and heart.pkl in ml_models/ for the 201 test).
"""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.patients.models import Patient
from django.test import TestCase

User = get_user_model()

# Valid heart features (order matches predictor.FEATURE_ORDER["heart"])
HEART_FEATURES = {
    "age": 55,
    "sex": 1,
    "cp": 2,
    "trestbps": 130,
    "chol": 220,
    "fbs": 0,
    "restecg": 1,
    "thalach": 150,
    "exang": 0,
    "oldpeak": 1.5,
    "slope": 1,
    "ca": 0,
    "thal": 2,
}


class ProviderPredictTests(TestCase):
    """APIClient tests for provider predict: 201 with patient_id, 400 without."""

    def setUp(self):
        self.client = APIClient()

    def test_provider_predict_with_patient_id_returns_201_and_result(self):
        """Provider POST with valid features + patient_id -> 201, response has prediction, probability, risk_level."""
        provider = User.objects.create_user(
            username="test_provider",
            password="testpass123",
            email="provider@test.example",
            role=User.Role.PROVIDER,
            full_name="Test Provider",
        )
        patient_user = User.objects.create_user(
            username="test_patient",
            password="testpass123",
            email="patient@test.example",
            role=User.Role.PATIENT,
            full_name="Test Patient",
        )
        patient = Patient.objects.create(user=patient_user)

        self.client.force_login(provider)

        response = self.client.post(
            "/api/predict/heart/",
            {"features": HEART_FEATURES, "patient_id": patient.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertIn("prediction", data)
        self.assertIn(data["prediction"], (0, 1), "prediction must be 0 or 1")
        self.assertIn("probability", data)
        self.assertIsInstance(data["probability"], (int, float))
        self.assertGreaterEqual(data["probability"], 0)
        self.assertLessEqual(data["probability"], 1)
        self.assertIn("risk_level", data)
        self.assertIn(data["risk_level"], ("Low", "Moderate", "High", "Critical"))

    def test_provider_predict_without_patient_id_returns_400(self):
        """Provider POST without patient_id -> 400 and error/hint message."""
        provider = User.objects.create_user(
            username="test_provider2",
            password="testpass123",
            email="provider2@test.example",
            role=User.Role.PROVIDER,
            full_name="Test Provider 2",
        )

        self.client.force_login(provider)

        response = self.client.post(
            "/api/predict/heart/",
            {"features": HEART_FEATURES},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        data = response.json()
        self.assertIn("error", data)
        self.assertIn("patient_id", data["error"].lower())
        self.assertIn("hint", data)
