from django.contrib import admin
from .models import Prediction


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "disease_type", "prediction", "probability", "risk_level", "created_at")
    list_filter = ("disease_type", "risk_level")
    search_fields = ("patient__user__username", "patient__user__email")
