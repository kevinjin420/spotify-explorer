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

# --- User Authentication Views (Unchanged) ---

class SpotifyUserView(APIView):
    """Handles user creation and authentication, returning a JWT."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SpotifyUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        
        user, created = SpotifyUser.objects.update_or_create(
            spotify_id=validated_data['spotify_id'],
            defaults=validated_data
        )

        payload = {
            'spotify_id': user.spotify_id,
            'exp': datetime.utcnow() + timedelta(hours=1),
        }
        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')

        return Response({"message": "User authenticated", "token": token}, status=status.HTTP_200_OK)

    def delete(self, request):
        # This part is for user deletion, remains unchanged.
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
    """Returns the profile of the currently authenticated user."""
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        serializer = SpotifyUserSerializer(request.user)
        return Response(serializer.data)

# --- Base API Views for Spotify ---

class SpotifyAPIView(APIView):
    """Base class to handle authenticated requests to the Spotify API."""
    permission_classes = [IsAuthenticated]

    def get_spotify_api_headers(self):
        # We can remove 'request' as an argument since it's available as self.request
        return {
            'Authorization': f'Bearer {self.request.user.access_token}'
        }

    def spotify_request(self, endpoint, params=None):
        headers = self.get_spotify_api_headers()
        try:
            response = requests.get(f'https://api.spotify.com/v1{endpoint}', headers=headers, params=params)
            response.raise_for_status() # Raises an HTTPError for bad responses (4xx or 5xx)
            return response.json()
        except requests.exceptions.HTTPError as e:
            # Handle token expiration or other API errors gracefully
            if e.response.status_code == 401:
                # Here you could implement token refresh logic if you have the refresh_token
                return {'error': 'Spotify token may have expired.', 'status_code': 401}
            return {'error': str(e), 'status_code': e.response.status_code}
        except requests.exceptions.RequestException as e:
            # Handle network errors
            return {'error': f'Network error: {str(e)}', 'status_code': 503}

# --- NEW: Snapshot View ---

class SnapshotView(SpotifyAPIView):
    """
    Fetches a snapshot of the user's top 5 tracks, artists, genres, 
    and albums for the short term (last 4 weeks).
    """
    def get(self, request, *args, **kwargs):
        # 1. Fetch top 50 tracks and artists to derive albums and genres
        top_tracks_data = self.spotify_request('/me/top/tracks', {'limit': 50, 'time_range': 'short_term'})
        top_artists_data = self.spotify_request('/me/top/artists', {'limit': 50, 'time_range': 'short_term'})

        # Error handling for API requests
        if 'error' in top_tracks_data or 'error' in top_artists_data:
            return Response({'error': 'Failed to fetch data from Spotify.'}, status=status.HTTP_502_BAD_GATEWAY)

        # 2. Process data
        top_tracks = top_tracks_data.get('items', [])
        top_artists = top_artists_data.get('items', [])

        # Derive top 5 genres from the top 50 artists
        all_genres = [genre for artist in top_artists for genre in artist.get('genres', [])]
        top_genres = [genre[0] for genre in Counter(all_genres).most_common(5)]

        # Derive top 5 albums from the top 50 tracks
        all_albums = [track['album'] for track in top_tracks if 'album' in track]
        # Count album occurrences by ID to handle duplicates
        album_counts = Counter(album['id'] for album in all_albums)
        # Get the unique album objects, sorted by their frequency
        unique_albums = {album['id']: album for album in all_albums}
        sorted_album_ids = [album_id for album_id, count in album_counts.most_common(5)]
        top_albums = [unique_albums[album_id] for album_id in sorted_album_ids]

        # 3. Assemble response
        response_data = {
            'top_tracks': top_tracks[:5],
            'top_artists': top_artists[:5],
            'top_genres': top_genres,
            'top_albums': top_albums,
        }
        return Response(response_data)


# detailed stats views

class TopItemsBaseView(SpotifyAPIView):
    """Base view for fetching top items with time_range parameter."""
    def get_time_range(self):
        time_range = self.request.query_params.get('time_range', 'medium_term')
        if time_range not in ['short_term', 'medium_term', 'long_term']:
            return 'medium_term' # Default to medium_term if invalid
        return time_range

class TopTracksView(TopItemsBaseView):
    """Returns the top 50 tracks for the user."""
    def get(self, request, *args, **kwargs):
        time_range = self.get_time_range()
        data = self.spotify_request('/me/top/tracks', {'limit': 50, 'time_range': time_range})
        if 'error' in data:
            return Response(data, status=data.get('status_code', 502))
        return Response(data.get('items', []))

class TopArtistsView(TopItemsBaseView):
    """Returns the top 50 artists for the user."""
    def get(self, request, *args, **kwargs):
        time_range = self.get_time_range()
        data = self.spotify_request('/me/top/artists', {'limit': 50, 'time_range': time_range})
        if 'error' in data:
            return Response(data, status=data.get('status_code', 502))
        return Response(data.get('items', []))

class TopGenresView(TopItemsBaseView):
    """Derives and returns the top 50 genres for the user."""
    def get(self, request, *args, **kwargs):
        time_range = self.get_time_range()
        artists_data = self.spotify_request('/me/top/artists', {'limit': 50, 'time_range': time_range})
        if 'error' in artists_data:
            return Response(artists_data, status=artists_data.get('status_code', 502))

        all_genres = [genre for artist in artists_data.get('items', []) for genre in artist.get('genres', [])]
        # Return a list of objects with genre name and count
        top_genres = [{'genre': genre, 'count': count} for genre, count in Counter(all_genres).most_common(50)]
        return Response(top_genres)

class TopAlbumsView(TopItemsBaseView):
    """Derives and returns the top 50 albums for the user."""
    def get(self, request, *args, **kwargs):
        time_range = self.get_time_range()
        tracks_data = self.spotify_request('/me/top/tracks', {'limit': 50, 'time_range': time_range})
        if 'error' in tracks_data:
            return Response(tracks_data, status=tracks_data.get('status_code', 502))
        
        all_albums = [track['album'] for track in tracks_data.get('items', []) if 'album' in track]
        album_counts = Counter(album['id'] for album in all_albums)
        unique_albums = {album['id']: album for album in all_albums}

        # Create a list of album objects with their play counts in the top 50 tracks
        sorted_albums = []
        for album_id, count in album_counts.most_common(50):
            album_data = unique_albums[album_id]
            album_data['count'] = count # Add the count to the album object
            sorted_albums.append(album_data)
            
        return Response(sorted_albums)

class PlaylistsView(SpotifyAPIView):
    """View to get all of a user's playlists, handling pagination."""
    def get(self, request, *args, **kwargs):
        playlists = []
        endpoint = '/me/playlists'
        params = {'limit': 50}

        while endpoint:
            data = self.spotify_request(endpoint, params=params)
            if 'error' in data:
                return Response(data, status=data.get('status_code', 502))
            
            playlists.extend(data.get('items', []))
            # Get the URL for the next page, or None if it's the last page
            endpoint = data.get('next') 
            # The 'next' URL is a full URL, so no params are needed for subsequent requests
            params = None 

        return Response(playlists)