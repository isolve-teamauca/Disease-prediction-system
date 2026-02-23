from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Patient
from .serializers import PatientSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def patient_by_id(request):
    """Provider-only: GET /api/patients/?patient_id=<id> returns patient details and total_predictions."""
    if request.user.role != "provider":
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    patient_id = request.query_params.get("patient_id")
    if not patient_id:
        return Response(
            {"detail": "Query param patient_id is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        patient = Patient.objects.get(pk=patient_id)
    except (Patient.DoesNotExist, ValueError):
        return Response({"detail": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)
    user = patient.user
    total_predictions = patient.predictions.count()
    return Response({
        "id": patient.id,
        "full_name": user.full_name or getattr(user, "username", "") or "",
        "email": user.email or "",
        "date_joined": user.date_joined.isoformat() if user.date_joined else None,
        "total_predictions": total_predictions,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Current user's patient profile (404 if not a patient)."""
    if request.user.role != "patient":
        return Response(
            {"detail": "User is not a patient."},
            status=status.HTTP_404_NOT_FOUND,
        )
    try:
        patient = Patient.objects.get(user=request.user)
    except Patient.DoesNotExist:
        return Response({"detail": "Patient profile not found."}, status=status.HTTP_404_NOT_FOUND)
    serializer = PatientSerializer(patient)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lookup(request, pk):
    """Provider-only: get patient by id (for verify flow). Returns 404 if not provider or patient not found."""
    if request.user.role != "provider":
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    try:
        patient = Patient.objects.get(pk=pk)
    except (Patient.DoesNotExist, ValueError):
        return Response({"detail": "Patient not found."}, status=status.HTTP_404_NOT_FOUND)
    serializer = PatientSerializer(patient)
    return Response(serializer.data)
