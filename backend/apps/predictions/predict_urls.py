"""URLs for POST /api/predict/<disease>/"""
from django.urls import path

from . import views

urlpatterns = [
    path("<str:disease>/", views.predict),
]
