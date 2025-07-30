from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from ..models import SpotifyUser
from ..serializers import SpotifyUserSerializer
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
import jwt


class SpotifyUserView(APIView):
    """Handles user creation and authentication, returning a JWT."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SpotifyUserSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        token_expires_in = validated_data['token_expires_in']
        token_expires_at = timezone.now() + timedelta(seconds=token_expires_in)
        
        user, created = SpotifyUser.objects.update_or_create(
            spotify_id=validated_data['spotify_id'],
            defaults={
                **validated_data,
                'token_expires_at': token_expires_at,
            }
        )

        access_payload = {
            'spotify_id': user.spotify_id,
            'exp': timezone.now() + timedelta(minutes=15),
            'type': 'access'
        }
        access_token = jwt.encode(access_payload, settings.JWT_SECRET_KEY, algorithm='HS256')

        refresh_payload = {
            'spotify_id': user.spotify_id,
            'exp': timezone.now() + timedelta(days=7),
            'type': 'refresh'
        }
        refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET_KEY, algorithm='HS256')

        return Response({
            "message": "User authenticated",
            "access": access_token,
            "refresh": refresh_token
        }, status=status.HTTP_200_OK)

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


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(refresh_token, settings.JWT_SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Refresh token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

        if payload.get('type') != 'refresh':
            return Response({'error': 'Invalid token type'}, status=status.HTTP_401_UNAUTHORIZED)

        spotify_id = payload['spotify_id']
        try:
            user = SpotifyUser.objects.get(spotify_id=spotify_id)
        except SpotifyUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_401_UNAUTHORIZED)

        access_payload = {
            'spotify_id': user.spotify_id,
            'exp': timezone.now() + timedelta(minutes=15),
            'type': 'access'
        }
        access_token = jwt.encode(access_payload, settings.JWT_SECRET_KEY, algorithm='HS256')

        return Response({'access': access_token}, status=status.HTTP_200_OK)


