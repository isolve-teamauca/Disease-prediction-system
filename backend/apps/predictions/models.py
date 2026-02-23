"""
Stores disease risk predictions per patient.
"""
from django.db import models

from apps.patients.models import Patient


class Prediction(models.Model):
    """
    One prediction record: patient, disease, outcome, probability, risk level.
    """

    class DiseaseType(models.TextChoices):
        HEART = "heart", "Heart Disease"
        HYPERTENSION = "hypertension", "Hypertension"
        STROKE = "stroke", "Stroke"
        DIABETES = "diabetes", "Diabetes"

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name="predictions",
    )
    disease_type = models.CharField(max_length=50, choices=DiseaseType.choices)
    prediction = models.IntegerField(help_text="0 = negative, 1 = positive")
    probability = models.FloatField()
    risk_level = models.CharField(max_length=20)  # Low, Medium, High
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "predictions_prediction"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.disease_type} – patient {self.patient_id} ({self.risk_level})"
