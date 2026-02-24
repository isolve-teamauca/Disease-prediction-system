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
        # Normalize empty strings to None for optional/DateField
        for field in ("date_of_birth",):
            if field in data and data[field] == "":
                data[field] = None
        return data

    def create(self, validated_data):
        validated_data.pop("confirm_password", None)
        # Ensure optional fields are None not empty string for DateField
        if validated_data.get("date_of_birth") == "":
            validated_data["date_of_birth"] = None
        user = User.objects.create_user(**validated_data)
        return user
