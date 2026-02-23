from django.urls import path

from . import views

app_name = "predictions"

urlpatterns = [
    path("", views.prediction_list),
    path("history/", views.prediction_list),
    # Reserved: prediction detail by ID — not yet used by frontend
    path("<int:pk>/", views.prediction_detail),
]
