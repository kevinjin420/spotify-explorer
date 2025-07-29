from rest_framework import serializers
from .models import SpotifyUser, Playlist, Track

class SpotifyUserSerializer(serializers.ModelSerializer):
    spotify_id = serializers.CharField(max_length=50)

    class Meta:
        model = SpotifyUser
        fields = [
            'spotify_id', 'display_name', 'profile_image', 'email',
            'access_token', 'refresh_token', 'token_expires_in', 'token_expires_at', 'scope'
        ]
        # extra_kwargs = {
        #     'display_name': {'required': False, 'allow_null': True},
        #     'profile_image': {'required': False, 'allow_null': True},
        #     'email': {'required': False, 'allow_null': True, 'allow_blank': True},
        # }


class SpotifyTrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = ['id', 'title', 'artist', 'status', 'downloaded_path']

class SpotifyPlaylistSerializer(serializers.ModelSerializer):
    tracks = SpotifyTrackSerializer(many=True, read_only=True)

    class Meta:
        model = Playlist
        fields = ['id', 'name', 'tracks']