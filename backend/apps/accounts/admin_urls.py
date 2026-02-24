from django.urls import path

from . import admin_views

app_name = "accounts_admin"

urlpatterns = [
    path("stats/", admin_views.admin_stats),
    path("users/", admin_views.admin_users),
]
