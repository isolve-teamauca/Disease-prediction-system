from django.urls import path

from . import views

app_name = "users"

urlpatterns = [
    path("me/", views.current_user),
    path("register/", views.register),
]
