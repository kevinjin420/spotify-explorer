from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import os
import yt_dlp
from yt_dlp import YoutubeDL
import requests
from django.utils import timezone
from datetime import timedelta
from django.http import HttpResponse
import io
import zipfile
import tempfile
import shutil

class DownloadPlaylist(APIView):
    permission_classes = [IsAuthenticated]

    def refresh_access_token_if_needed(self, user):
        if user.token_expires_at > timezone.now():
            return

        print("Refreshing expired Spotify access token")
        response = requests.post(
            'https://accounts.spotify.com/api/token',
            data={
                'grant_type': 'refresh_token',
                'refresh_token': user.refresh_token,
                'client_id': os.getenv('SPOTIFY_CLIENT_ID'),
                'client_secret': os.getenv('SPOTIFY_CLIENT_SECRET'),
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )

        if response.status_code != 200:
            raise Exception('Failed to refresh token')

        token_data = response.json()
        user.access_token = token_data['access_token']
        user.token_expires_in = token_data.get('expires_in', 3600)
        user.token_expires_at = timezone.now() + timedelta(seconds=user.token_expires_in)
        user.save()

    def get_spotify_api_headers(self):
        self.refresh_access_token_if_needed(self.request.user)
        return {
            'Authorization': f'Bearer {self.request.user.access_token}'
        }

    def spotify_request(self, endpoint, params=None):
        self.refresh_access_token_if_needed(self.request.user)
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

    def post(self, request, playlist_id):
        playlist_data = self.spotify_request(f'/playlists/{playlist_id}')
        if 'error' in playlist_data:
            return Response(playlist_data, status=playlist_data.get('status_code', 502))

        tracks = playlist_data.get('tracks', {}).get('items', [])
        if not tracks:
            return Response({'message': 'No tracks found in the playlist.'}, status=404)

        playlist_name = playlist_data.get('name', 'spotify_playlist')
        temp_dir = tempfile.mkdtemp()
        downloaded_files = []

        try:
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': os.path.join(temp_dir, '%(title)s.%(ext)s'),
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
                'quiet': True,
                'noplaylist': True,
            }

            with YoutubeDL(ydl_opts) as ydl:
                for item in tracks:
                    track = item.get('track')
                    if not track:
                        continue

                    track_name = track.get('name')
                    artist_name = ', '.join([artist.get('name') for artist in track.get('artists', [])])
                    query = f"{track_name} {artist_name} audio"

                    try:
                        info = ydl.extract_info(f"ytsearch:{query}", download=True)['entries'][0]
                        filename, _ = os.path.splitext(ydl.prepare_filename(info))
                        downloaded_files.append(filename + '.mp3')
                    except Exception as e:
                        print(f"Failed to download {track_name}: {e}")

            if not downloaded_files:
                return Response({'message': 'Could not download any tracks.'}, status=404)

            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for file_path in downloaded_files:
                    if os.path.exists(file_path):
                        zip_file.write(file_path, os.path.basename(file_path))

            zip_buffer.seek(0)
            response = HttpResponse(zip_buffer, content_type='application/zip')
            response['Content-Disposition'] = f'attachment; filename="{playlist_name}.zip"'
            return response

        finally:
            shutil.rmtree(temp_dir)
