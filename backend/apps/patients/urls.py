from django.urls import path

from . import views

app_name = "patients"

urlpatterns = [
    path("", views.patient_by_id),
    path("me/", views.me),
    path("<int:pk>/", views.lookup),
]
