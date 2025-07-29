from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from .models import SpotifyUser, Playlist
from .serializers import SpotifyUserSerializer, SpotifyPlaylistSerializer
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie, vary_on_headers
import requests
from collections import Counter
import jwt
import os
import time
from yt_dlp import YoutubeDL

class SpotifyUserView(APIView):
    """Handles user creation and authentication, returning a JWT."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SpotifyUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        token_expires_in = validated_data['token_expires_in']
        token_expires_at = datetime.now() + timedelta(seconds=token_expires_in)
        
        user, created = SpotifyUser.objects.update_or_create(
            spotify_id=validated_data['spotify_id'],
            defaults={
                **validated_data,
                'token_expires_at': token_expires_at,
            }
        )

        payload = {
            'spotify_id': user.spotify_id,
            'exp': datetime.now() + timedelta(hours=1),
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
    """Returns the profile of the currently authenticated user."""
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        serializer = SpotifyUserSerializer(request.user)
        return Response(serializer.data)


class SpotifyAPIView(APIView):
    """Base class to handle authenticated requests to the Spotify API."""
    permission_classes = [IsAuthenticated]

class SpotifyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def refresh_access_token_if_needed(self, user):
        print("Refreshing Access Token")
        time_since_update = (timezone.now() - user.updated_at).total_seconds()
        if time_since_update < user.token_expires_in:
            return

        response = requests.post(
            'https://accounts.spotify.com/api/token',
            data={
                'grant_type': 'refresh_token',
                'refresh_token': user.refresh_token,
                'client_id': settings.SPOTIFY_CLIENT_ID,
                'client_secret': settings.SPOTIFY_CLIENT_SECRET,
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )

        if response.status_code != 200:
            raise Exception('Failed to refresh token')

        token_data = response.json()
        user.access_token = token_data['access_token']
        user.token_expires_in = token_data.get('expires_in', 3600)
        user.save()

    def get_spotify_api_headers(self):
        self.refresh_access_token_if_needed(self.request.user)
        return {
            'Authorization': f'Bearer {self.request.user.access_token}'
        }

    def spotify_request(self, endpoint, params=None):
        headers = self.get_spotify_api_headers()
        try:
            response = requests.get(f'https://api.spotify.com/v1{endpoint}', headers=headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                return {'error': 'Spotify token may have expired.', 'status_code': 401}
            return {'error': str(e), 'status_code': e.response.status_code}
        except requests.exceptions.RequestException as e:
            return {'error': f'Network error: {str(e)}', 'status_code': 503}


class SnapshotView(SpotifyAPIView):
    @method_decorator(cache_page(60 * 5))
    @method_decorator(vary_on_headers('Authorization'))
    def get(self, request, *args, **kwargs):
        print("Re-fetching SnapshotView")
        time.sleep(2) # artificial delay

        top_tracks_data = self.spotify_request('/me/top/tracks', {'limit': 50, 'time_range': 'short_term'})
        top_artists_data = self.spotify_request('/me/top/artists', {'limit': 50, 'time_range': 'short_term'})

        if 'error' in top_tracks_data or 'error' in top_artists_data:
            return Response({'error': 'Failed to fetch data from Spotify.'}, status=status.HTTP_502_BAD_GATEWAY)

        top_tracks = top_tracks_data.get('items', [])
        top_artists = top_artists_data.get('items', [])

        all_genres = [genre for artist in top_artists for genre in artist.get('genres', [])]
        top_genres = [genre[0] for genre in Counter(all_genres).most_common(5)]

        all_albums = [track['album'] for track in top_tracks if 'album' in track]
        album_counts = Counter(album['id'] for album in all_albums)
        unique_albums = {album['id']: album for album in all_albums}
        sorted_album_ids = [album_id for album_id, count in album_counts.most_common(5)]
        top_albums = [unique_albums[album_id] for album_id in sorted_album_ids]

        response_data = {
            'top_tracks': top_tracks[:5],
            'top_artists': top_artists[:5],
            'top_genres': top_genres,
            'top_albums': top_albums,
        }
        return Response(response_data)


class TopItemsBaseView(SpotifyAPIView):
    def get_time_range(self):
        time_range = self.request.query_params.get('time_range', 'medium_term')
        if time_range not in ['short_term', 'medium_term', 'long_term']:
            return 'medium_term'
        return time_range

class TopTracksView(TopItemsBaseView):
    @method_decorator(cache_page(60 * 5)) # 5 mins
    @method_decorator(vary_on_headers('Authorization'))
    def get(self, request, *args, **kwargs):
        print("Re-fetching TopTracksView")
        time.sleep(2) # artificial delay

        time_range = self.get_time_range()
        data = self.spotify_request('/me/top/tracks', {'limit': 50, 'time_range': time_range})
        if 'error' in data:
            return Response(data, status=data.get('status_code', 502))
        return Response(data.get('items', []))

class TopArtistsView(TopItemsBaseView):
    @method_decorator(cache_page(60 * 5))
    @method_decorator(vary_on_headers('Authorization'))
    def get(self, request, *args, **kwargs):
        print("Re-fetching TopArtistsView")
        time.sleep(2) # artificial delay
        
        time_range = self.get_time_range()
        data = self.spotify_request('/me/top/artists', {'limit': 50, 'time_range': time_range})
        if 'error' in data:
            return Response(data, status=data.get('status_code', 502))
        return Response(data.get('items', []))

class TopGenresView(TopItemsBaseView):
    @method_decorator(cache_page(60 * 5))
    @method_decorator(vary_on_headers('Authorization'))
    def get(self, request, *args, **kwargs):
        print("Re-calculating TopGenresView")
        time.sleep(2) # artificial delay
        
        time_range = self.get_time_range()
        artists_data = self.spotify_request('/me/top/artists', {'limit': 50, 'time_range': time_range})
        if 'error' in artists_data:
            return Response(artists_data, status=artists_data.get('status_code', 502))

        all_genres = [genre for artist in artists_data.get('items', []) for genre in artist.get('genres', [])]
        top_genres = [{'genre': genre, 'count': count} for genre, count in Counter(all_genres).most_common(50)]
        return Response(top_genres)

class TopAlbumsView(TopItemsBaseView):
    @method_decorator(cache_page(60 * 5))
    @method_decorator(vary_on_headers('Authorization'))
    def get(self, request, *args, **kwargs):
        print("Re-calculating TopAlbumsView")
        time.sleep(2) # artificial delay
        
        time_range = self.get_time_range()
        tracks_data = self.spotify_request('/me/top/tracks', {'limit': 50, 'time_range': time_range})
        if 'error' in tracks_data:
            return Response(tracks_data, status=tracks_data.get('status_code', 502))
        
        all_albums = [track['album'] for track in tracks_data.get('items', []) if 'album' in track]
        album_counts = Counter(album['id'] for album in all_albums)
        unique_albums = {album['id']: album for album in all_albums}

        sorted_albums = []
        for album_id, count in album_counts.most_common(50):
            album_data = unique_albums[album_id]
            album_data['count'] = count
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
            endpoint = data.get('next') 
            params = None 

        return Response(playlists)
    
class PlaylistDetailView(SpotifyAPIView):
    def get(self, request, playlist_id):
        try:
            playlist_data = self.spotify_request(f'/playlists/{playlist_id}')
        except Exception as e:
            print("Spotify API error:", e)
            return Response({'error': 'Failed to fetch from Spotify'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(playlist_data, status=status.HTTP_200_OK)
    
class DownloadTrack(APIView):
    def post(request):
        track_title = request.data.get('title')
        artist = request.data.get('artist')

        if not track_title or not artist:
            return Response({'error': 'Missing title or artist'}, status=400)

        query = f"ytsearch:{track_title} {artist}"
        output_dir = "/path/to/downloads/"
        os.makedirs(output_dir, exist_ok=True)

        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'quiet': True,
            'noplaylist': True,
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(query, download=True)
                title = info['title']
                return Response({'status': 'success', 'title': title})
        except Exception as e:
            return Response({'error': str(e)}, status=500)