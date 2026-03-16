"""
Custom User model for Disease Risk Prediction System.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user with email as optional identifier and role support.
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        HEALTHCARE = "healthcare", "Healthcare Professional"
        PATIENT = "patient", "Patient"

    email = models.EmailField("email address", blank=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users_user"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.username or self.email or str(self.pk)
