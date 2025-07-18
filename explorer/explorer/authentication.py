# your_app/authentication.py
import jwt
from django.conf import settings
from rest_framework import authentication
from rest_framework import exceptions
from .models import SpotifyUser

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).split()

        if not auth_header or auth_header[0].lower() != b'bearer':
            return None

        if len(auth_header) == 1:
            raise exceptions.AuthenticationFailed('Invalid token header. No credentials provided.')
        elif len(auth_header) > 2:
            raise exceptions.AuthenticationFailed('Invalid token header. Token string should not contain spaces.')

        try:
            token = auth_header[1].decode('utf-8')
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Authentication error: {e}')

        try:
            spotify_id = payload['spotify_id']
            user = SpotifyUser.objects.get(spotify_id=spotify_id)
        except SpotifyUser.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')

        return (user, token)
