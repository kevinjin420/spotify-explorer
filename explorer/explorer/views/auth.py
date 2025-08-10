import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import SpotifyUser
from ..serializers import SpotifyUserSerializer
import os


class SpotifyLogin(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get("code")
        verifier = request.data.get("verifier")

        if not code or not verifier:
            return Response({"error": "Missing code or verifier"}, status=400)

        try:
            # 1. Exchange code + verifier for tokens from Spotify
            token_response = requests.post(
                "https://accounts.spotify.com/api/token",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": "http://127.0.0.1:5173/callback",
                    "client_id": os.getenv("SPOTIFY_CLIENT_ID"),
                    "code_verifier": verifier,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_response.raise_for_status()
            token_data = token_response.json()

            access_token = token_data["access_token"]
            refresh_token = token_data["refresh_token"]
            expires_in = token_data["expires_in"]
            scope = token_data["scope"]

            # 2. Get Spotify profile
            profile_response = requests.get(
                "https://api.spotify.com/v1/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            profile_response.raise_for_status()
            user_data = profile_response.json()

            # 3. Save or update user
            spotify_id = user_data["id"]
            user, created = SpotifyUser.objects.update_or_create(
                spotify_id=spotify_id,
                defaults={
                    "display_name": user_data["display_name"],
                    "email": user_data["email"],
                    "profile_image": user_data["images"][0]["url"] if user_data["images"] else None,
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_expires_in": expires_in,"token_expires_at": timezone.now() + timedelta(seconds=expires_in),
                    "scope": scope,
                },
            )

            # 4. Generate SimpleJWT tokens
            refresh = RefreshToken()
            refresh["user_id"] = user.id

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": SpotifyUserSerializer(user).data,
            })

        except requests.RequestException as e:
            return Response({"error": "Spotify API error", "detail": str(e)}, status=500)
        except Exception as e:
            return Response({"error": "Internal error", "detail": str(e)}, status=500)
