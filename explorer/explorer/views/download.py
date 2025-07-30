from rest_framework.views import APIView
from rest_framework.response import Response
import os
from yt_dlp import YoutubeDL

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