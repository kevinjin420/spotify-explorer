from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from .models import SpotifyUser
from .serializers import SpotifyUserSerializer
from datetime import datetime, timedelta
from django.conf import settings
import requests
from collections import Counter
import jwt


class SpotifyUserView(APIView):
    permission_classes = [AllowAny]  # new users

    def post(self, request):
        # Use the serializer for validation
        serializer = SpotifyUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # .validated_data is now a clean, validated dictionary
        validated_data = serializer.validated_data
        
        # update_or_create is great! Keep using it.
        user, created = SpotifyUser.objects.update_or_create(
            spotify_id=validated_data['spotify_id'],
            defaults=validated_data
        )

        # JWT generation remains the same
        payload = {
            'spotify_id': user.spotify_id,
            'exp': datetime.utcnow() + timedelta(hours=1),
        }
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')

        return Response({"message": "User authenticated", "token": token}, status=status.HTTP_200_OK)

    def delete(self, request):
        spotify_id = request.data.get('spotify_id')
        if not spotify_id:
            return Response({'error': 'spotify_id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = SpotifyUser.objects.get(spotify_id=spotify_id)
            user.delete()
            return Response({'status': 'deleted'}, status=status.HTTP_200_OK)
        except SpotifyUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class MeView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        # Because of JWTAuthentication, request.user is the authenticated SpotifyUser instance
        serializer = SpotifyUserSerializer(request.user)
        return Response(serializer.data)

class SpotifyAPIView(APIView):
    """Base class to handle authenticated requests to the Spotify API."""
    permission_classes = [IsAuthenticated]

    def get_spotify_api_headers(self, request):
        # request.user is the authenticated SpotifyUser instance from our JWT auth
        return {
            'Authorization': f'Bearer {request.user.access_token}'
        }

    def spotify_request(self, endpoint, params=None):
        headers = self.get_spotify_api_headers(self.request)
        response = requests.get(f'https://api.spotify.com/v1{endpoint}', headers=headers, params=params)
        response.raise_for_status() # Will raise an exception for 4xx/5xx errors
        return response.json()


class TopItemsView(SpotifyAPIView):
    """View to get the user's top track, artist, and derived top genre."""
    def get(self, request, *args, **kwargs):
        try:
            # Fetch top tracks and artists from Spotify
            top_tracks_data = self.spotify_request('/me/top/tracks', {'limit': 1, 'time_range': 'short_term'})
            top_artists_data = self.spotify_request('/me/top/artists', {'limit': 10, 'time_range': 'short_term'})

            top_track = top_tracks_data['items'][0] if top_tracks_data['items'] else None
            top_artist = top_artists_data['items'][0] if top_artists_data['items'] else None

            # Derive top genre from the list of top artists
            all_genres = [genre for artist in top_artists_data.get('items', []) for genre in artist.get('genres', [])]
            top_genre = Counter(all_genres).most_common(1)[0][0] if all_genres else None

            response_data = {
                'top_track': top_track,
                'top_artist': top_artist,
                'top_genre': top_genre,
            }
            return Response(response_data)
        except Exception as e:
            return Response({'error': f'Failed to fetch from Spotify: {str(e)}'}, status=500)


class PlaylistsView(SpotifyAPIView):
    """View to get all of a user's playlists, handling pagination."""
    def get(self, request, *args, **kwargs):
        try:
            playlists = []
            # Start with the first page of playlists
            endpoint = '/me/playlists'
            params = {'limit': 50} # Max limit per request

            while endpoint:
                data = self.spotify_request(endpoint, params=params)
                playlists.extend(data['items'])
                endpoint = data.get('next') # Get the URL for the next page, or None if it's the last page
                params = None # The 'next' URL already includes all necessary parameters

            return Response(playlists)
        except Exception as e:
            return Response({'error': f'Failed to fetch from Spotify: {str(e)}'}, status=500)

