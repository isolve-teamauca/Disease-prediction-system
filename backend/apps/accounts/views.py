from django.contrib.auth import authenticate
from django.contrib.auth import login as auth_login
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User
from .serializers import UserSerializer, UserCreateSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """
    Session login. Accepts { "username" or "email", "password" }.
    Returns current user on success. Frontend must send credentials (cookies) on subsequent requests.
    """
    username = request.data.get("username") or request.data.get("email")
    password = request.data.get("password")
    if not username or not password:
        return Response(
            {"detail": "Username/email and password required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    # Allow login by email: find user by email then authenticate by username
    user = User.objects.filter(email=username).first()
    if user:
        username = user.username
    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {"detail": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    auth_login(request, user)
    return Response(UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """Session logout."""
    from django.contrib.auth import logout as auth_logout
    auth_logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return the currently authenticated user."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """Register a new user (patient or provider)."""
    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Create Patient profile when role is patient
        if user.role == "patient":
            from apps.patients.models import Patient

            Patient.objects.get_or_create(user=user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
