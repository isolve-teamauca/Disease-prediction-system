from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.predictions.models import Prediction


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """
    Summary stats for the dashboard (e.g. total predictions, by status).
    """
    qs = Prediction.objects.filter(user=request.user)
    return Response({
        "total_predictions": qs.count(),
        "by_status": {
            "pending": qs.filter(status="pending").count(),
            "completed": qs.filter(status="completed").count(),
            "failed": qs.filter(status="failed").count(),
        },
    })
