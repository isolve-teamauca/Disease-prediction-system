"""
Custom User model for MedPredict: patient and provider roles.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user with role: patient or provider.
    Provider-specific: specialization, license_number.
    """

    class Role(models.TextChoices):
        PATIENT = "patient", "Patient"
        PROVIDER = "provider", "Healthcare Provider"
        ADMIN = "admin", "Admin"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT,
    )
    full_name = models.CharField("full name", max_length=255, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField("email address", blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    # Provider-only (nullable for patients)
    specialization = models.CharField(max_length=100, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts_user"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.username or self.email or str(self.pk)
