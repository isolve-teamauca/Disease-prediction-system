import logging

from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.patients.models import Patient

logger = logging.getLogger(__name__)
from apps.predictions.models import Prediction
from apps.predictions.serializers import PredictionSerializer


def _get_patient_for_request(request):
    """
    Resolve patient for the current request.
    - If user.role == "patient": return their Patient profile.
    - If user.role == "provider": require patient_id in request body; return that Patient.
    - Otherwise return None.
    """
    user = request.user
    if user.role == "patient":
        try:
            return Patient.objects.get(user=user)
        except Patient.DoesNotExist:
            return None
    if user.role == "provider":
        patient_id = request.data.get("patient_id")
        if not patient_id:
            return None
        try:
            return Patient.objects.get(pk=patient_id)
        except (Patient.DoesNotExist, ValueError):
            return None
    return None


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def predict(request, disease):
    """
    POST /api/predict/<disease>/
    Body: { "features": { "feature_name": value, ... }, optional "patient_id" for providers }
    Returns: { "prediction": 0|1, "probability": float, "risk_level": str, "risk_color": str, "risk_advice": str }
    Saves prediction to DB linked to patient.
    """
    from ml_models.predictor import predict_disease, SUPPORTED_DISEASES, FEATURE_ORDER

    # 1. Validate disease is supported
    disease = disease.lower().strip()
    if disease not in SUPPORTED_DISEASES:
        return Response(
            {"detail": f"Unsupported disease. Supported: {SUPPORTED_DISEASES}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    patient = _get_patient_for_request(request)
    if patient is None:
        if request.user.role == "provider" and not request.data.get("patient_id"):
            logger.warning(
                "predict(): provider %s submitted without patient_id",
                request.user.username,
            )
            return Response(
                {
                    "error": "Providers must include patient_id in the request body.",
                    "hint": "Send { features: {...}, patient_id: '<patient_code>' } in the request.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"detail": "Patient not found. Sign in as a patient or provide a valid patient_id (for providers)."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 2. Validate features is a dict
    features = request.data.get("features")
    if features is None:
        return Response(
            {"detail": "Request body must include 'features'."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not isinstance(features, dict):
        return Response(
            {"detail": "'features' must be a JSON object."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 3. Explicit input validation: required fields and numeric types
    required = FEATURE_ORDER.get(disease, [])
    missing = [f for f in required if f not in features]
    if missing:
        logger.warning("predict() validation failed: missing required fields for %s: %s", disease, missing)
        return Response(
            {"error": f"Missing required fields for {disease} disease: {missing}"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    non_numeric = []
    for name in required:
        val = features.get(name)
        try:
            float(val)
        except (TypeError, ValueError):
            non_numeric.append(name)
    if non_numeric:
        logger.warning("predict() validation failed: non-numeric fields for %s: %s", disease, non_numeric)
        return Response(
            {"error": f"Fields must be numeric for {disease} disease: {non_numeric}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Development debugging only
    if settings.DEBUG:
        logger.debug("predict() user_id=%s disease=%s features=%s", request.user.id, disease, features)

    try:
        result = predict_disease(disease, features)
    except (ImportError, OSError) as e:
        err_msg = str(e)
        if "DLL" in err_msg or "_distance_wrap" in err_msg or "Application Control" in err_msg:
            logger.warning("ML runtime blocked (DLL/policy): %s", err_msg)
            return Response(
                {
                    "error": "Prediction service unavailable: ML runtime was blocked (Windows Application Control / DLL policy).",
                    "hint": "Run backend/ml_models/build_placeholder_models.py on a machine without the block (or move this project to e.g. C:\\Projects\\) and copy the new .pkl files into backend/ml_models/. Then restart the server.",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        raise
    except ValueError as e:
        err_msg = str(e)
        if "features" in err_msg.lower() and ("expecting" in err_msg.lower() or "expected" in err_msg.lower()):
            logger.warning("Feature count mismatch for %s: %s", disease, err_msg)
            return Response(
                {
                    "error": f"The {disease} model expects a different number of features than the app sends.",
                    "hint": f"Retrain the model: from backend/ run python -m ml_models.train_{disease} (use a dataset with the same columns as in ml_models/predictor.py FEATURE_ORDER for {disease}), or run ml_models/build_placeholder_models.py and copy the new .pkl files.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        raise
    except Exception as e:
        logger.exception("Prediction error")
        if settings.DEBUG:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response({"error": "Prediction failed."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 3. Save prediction result in Prediction model
    Prediction.objects.create(
        patient=patient,
        disease_type=disease,
        prediction=result["prediction"],
        probability=result["probability"],
        risk_level=result["risk_level"],
    )

    return Response(result, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def prediction_list(request):
    """
    List predictions.
    - If user.role == "patient": return only their predictions.
    - If user.role == "provider": require query param patient_id; return that patient's predictions.
    - 400 if provider and patient_id missing; 404 if patient not found.
    """
    user = request.user
    if user.role == "patient":
        try:
            patient = Patient.objects.get(user=user)
        except Patient.DoesNotExist:
            return Response([])
        qs = Prediction.objects.filter(patient=patient)
    elif user.role == "provider":
        patient_id = request.query_params.get("patient_id")
        if patient_id is None or patient_id == "":
            return Response(
                {"detail": "Query param patient_id is required for providers."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            patient = Patient.objects.get(pk=patient_id)
        except (Patient.DoesNotExist, ValueError):
            return Response(
                {"detail": "Patient not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        qs = Prediction.objects.filter(patient=patient)
    else:
        qs = Prediction.objects.none()

    serializer = PredictionSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def prediction_detail(request, pk):
    """Get a single prediction by id (only if owned by current user's patient or current user is provider)."""
    user = request.user
    try:
        obj = Prediction.objects.get(pk=pk)
    except Prediction.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    if user.role == "patient":
        try:
            patient = Patient.objects.get(user=user)
        except Patient.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if obj.patient_id != patient.id:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    serializer = PredictionSerializer(obj)
    return Response(serializer.data)
