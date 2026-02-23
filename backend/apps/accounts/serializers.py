from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "role",
            "full_name",
            "phone",
            "date_of_birth",
            "specialization",
            "license_number",
            "first_name",
            "last_name",
        )
        read_only_fields = ("id", "role")


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "confirm_password",
            "role",
            "full_name",
            "phone",
            "date_of_birth",
            "specialization",
            "license_number",
        )

    def validate(self, data):
        if data.get("confirm_password") is not None and data.get("password") != data.get("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        user = User.objects.create_user(**validated_data)
        return user
