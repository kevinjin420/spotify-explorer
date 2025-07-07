# explorer/authentication.py
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from explorer.explorer.models import SpotifyUser as User

class JWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            raise AuthenticationFailed('Authorization header missing')

        try:
            # Expect the header to be "Bearer <token>"
            token = auth_header.split(' ')[1]
            decoded = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
            user = User.objects.get(username=decoded['spotify_id'])  # Or your user model logic
            return (user, None)  # Return user and None for authentication backend
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')
