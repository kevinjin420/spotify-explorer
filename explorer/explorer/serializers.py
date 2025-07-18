# your_app/serializers.py
from rest_framework import serializers
from .models import SpotifyUser

class SpotifyUserSerializer(serializers.ModelSerializer):
    # 👇 Override the spotify_id field to remove the unique validator
    spotify_id = serializers.CharField(max_length=50)

    class Meta:
        model = SpotifyUser
        fields = [
            'spotify_id', 'display_name', 'profile_image', 'email',
            'access_token', 'refresh_token', 'token_expires_in', 'scope'
        ]
        # These are still useful for optional fields
        extra_kwargs = {
            'display_name': {'required': False, 'allow_null': True},
            'profile_image': {'required': False, 'allow_null': True},
            'email': {'required': False, 'allow_null': True, 'allow_blank': True},
        }