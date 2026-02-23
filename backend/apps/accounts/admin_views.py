"""
Admin-only API: stats dashboard.
"""
from django.db.models import Count
from django.db.models.functions import TruncDate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import User
from apps.predictions.models import Prediction


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """
    GET /api/admin/stats/
    Returns aggregate stats for the admin dashboard.
    Only users with role='admin' may access; others get 403.
    """
    if getattr(request.user, "role", None) != "admin":
        return Response(
            {"detail": "Admin access required."},
            status=status.HTTP_403_FORBIDDEN,
        )

    total_patients = User.objects.filter(role="patient").count()
    total_providers = User.objects.filter(role="provider").count()
    total_predictions = Prediction.objects.count()

    predictions_by_disease = dict(
        Prediction.objects.values("disease_type")
        .annotate(count=Count("id"))
        .values_list("disease_type", "count")
    )
    # Ensure all four keys exist
    for key in ("heart", "diabetes", "stroke", "hypertension"):
        predictions_by_disease.setdefault(key, 0)

    predictions_by_risk_level = dict(
        Prediction.objects.values("risk_level")
        .annotate(count=Count("id"))
        .values_list("risk_level", "count")
    )
    # Normalize "Medium" -> "Moderate" for consistency if present
    if "Medium" in predictions_by_risk_level:
        predictions_by_risk_level["Moderate"] = (
            predictions_by_risk_level.get("Moderate", 0)
            + predictions_by_risk_level.pop("Medium", 0)
        )
    for key in ("Low", "Moderate", "High", "Critical"):
        predictions_by_risk_level.setdefault(key, 0)

    recent_registrations = [
        {
            "username": u.username,
            "role": u.role,
            "date_joined": u.date_joined.isoformat() if u.date_joined else None,
        }
        for u in User.objects.order_by("-date_joined")[:10]
    ]

    daily = (
        Prediction.objects.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )
    # Last 14 days: build a map date -> count
    from datetime import datetime, timedelta

    end = datetime.now().date()
    start = end - timedelta(days=13)
    daily_map = {d["date"]: d["count"] for d in daily if start <= d["date"] <= end}
    daily_predictions = [
        {"date": (start + timedelta(days=i)).isoformat(), "count": daily_map.get(start + timedelta(days=i), 0)}
        for i in range(14)
    ]

    return Response(
        {
            "total_patients": total_patients,
            "total_providers": total_providers,
            "total_predictions": total_predictions,
            "predictions_by_disease": predictions_by_disease,
            "predictions_by_risk_level": predictions_by_risk_level,
            "recent_registrations": recent_registrations,
            "daily_predictions": daily_predictions,
        }
    )
