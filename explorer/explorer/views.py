from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from .models import SpotifyUser
from .serializers import SpotifyUserSerializer
from datetime import datetime, timedelta
from django.conf import settings
import json
import jwt

class SpotifyUserView(APIView):
    permission_classes = [AllowAny]  # new users

    def post(self, request):
        try:
            data = request.data
            print("Received data:", json.dumps(data, indent=2))  # Add logging to check incoming data

            required_fields = ['spotify_id', 'access_token', 'refresh_token', 'expires_in', 'scope']
            missing = [field for field in required_fields if field not in data]
            if missing:
                return Response({"error": f"Missing fields: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)

            user, created = SpotifyUser.objects.update_or_create(
                spotify_id=data['spotify_id'],
                defaults={
                    'access_token': data['access_token'],
                    'refresh_token': data['refresh_token'],
                    'expires_in': data['expires_in'],
                    'scope': data['scope'],
                }
            )

            # Generate JWT token
            payload = {
                'spotify_id': data['spotify_id'],
                'exp': datetime.utcnow() + timedelta(hours=1),  # Token expires in 1 hour
            }
            token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')

            return Response({"message": "User authenticated", "token": token}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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


class DashboardView(APIView):
    # permission_classes = [IsAuthenticated]

    def get(self, request):
        ...