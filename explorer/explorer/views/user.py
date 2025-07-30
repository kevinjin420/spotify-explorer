from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..serializers import SpotifyUserSerializer

class MeView(APIView):
    """Returns the profile of the currently authenticated user."""
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        serializer = SpotifyUserSerializer(request.user)
        return Response(serializer.data)


