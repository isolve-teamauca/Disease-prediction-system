from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Patient
        fields = ("id", "user", "created_at")
