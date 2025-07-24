# models.py
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