from django.db import models

class SpotifyUser(models.Model):
    spotify_id = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=255)
    email = models.EmailField()
    profile_image = models.URLField(blank=True, null=True)
    access_token = models.TextField()
    refresh_token = models.TextField()
    scope = models.TextField()
    token_expires_in = models.IntegerField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.spotify_id

    @property
    def is_authenticated(self):
        return True


class Playlist(models.Model):
    user = models.ForeignKey(SpotifyUser, on_delete=models.CASCADE, related_name='playlists')
    spotify_id = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.spotify_id})"


class Track(models.Model):
    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name='tracks')
    spotify_track_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    youtube_video_id = models.CharField(max_length=100, blank=True, null=True)
    downloaded_path = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default="pending")  # pending, success, failed
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.artist}"
