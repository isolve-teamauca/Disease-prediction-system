from rest_framework import serializers

from .models import Prediction


class PredictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prediction
        fields = (
            "id",
            "patient",
            "disease_type",
            "prediction",
            "probability",
            "risk_level",
            "created_at",
        )
        read_only_fields = ("id", "created_at")
