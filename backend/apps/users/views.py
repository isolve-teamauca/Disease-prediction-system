from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import UserSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return the currently authenticated user."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """Register a new user (simplified; extend with UserCreateSerializer as needed)."""
    from .serializers import UserCreateSerializer

    serializer = UserCreateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
