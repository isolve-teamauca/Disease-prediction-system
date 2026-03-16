from django.urls import path

from . import views

app_name = "accounts"

urlpatterns = [
    path("login/", views.login),
    path("logout/", views.logout),
    path("me/", views.current_user),
    path("register/", views.register),
]
