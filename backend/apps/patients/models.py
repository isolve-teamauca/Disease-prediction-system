"""
Patient profile: one per user with role=patient.
"""
from django.conf import settings
from django.db import models


class Patient(models.Model):
    """Links a patient (User with role=patient) for predictions and records."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="patient_profile",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "patients_patient"
        verbose_name = "Patient"
        verbose_name_plural = "Patients"

    def __str__(self):
        return str(self.user)
