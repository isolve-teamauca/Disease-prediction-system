"""
URL configuration for Disease Risk Prediction System.
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def api_root(request):
    """Root URL: confirm backend is up and list API entry points for frontend."""
    return JsonResponse({
        "name": "MedPredict API",
        "version": "1.0",
        "endpoints": {
            "admin": "/admin/",
            "auth": "/api/auth/",
            "login": "/api/auth/login/",
            "logout": "/api/auth/logout/",
            "register": "/api/auth/register/",
            "me": "/api/auth/me/",
            "patients": "/api/patients/",
            "predict": "/api/predict/<disease>/",
            "predictions": "/api/predictions/",
            "admin_stats": "/api/admin/stats/",
        },
    })


urlpatterns = [
    path("", api_root),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/admin/", include("apps.accounts.admin_urls")),
    path("api/patients/", include("apps.patients.urls")),
    path("api/predict/", include("apps.predictions.predict_urls")),
    path("api/predictions/", include("apps.predictions.urls")),
]
