# models.py
from django.db import models

class SpotifyUser(models.Model):
    spotify_id = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=255)
    email = models.EmailField()
    profile_image = models.URLField(blank=True, null=True)
    access_token = models.CharField(max_length=255)
    refresh_token = models.CharField(max_length=255)
    scope = models.TextField()
    token_expires_in = models.IntegerField()
    updated_at = models.DateTimeField(auto_now=True)
