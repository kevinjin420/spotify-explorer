from django.urls import path, include
from explorer.explorer.models import SpotifyUser
from django.contrib import admin
from rest_framework import routers, serializers, viewsets
from explorer.explorer.views import auth, user, spotify, download
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Serializers define the API representation.
class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = SpotifyUser
        fields = ['url', 'username', 'email', 'is_staff']

# ViewSets define the view behavior.
class UserViewSet(viewsets.ModelViewSet):
    queryset = SpotifyUser.objects.all()
    serializer_class = UserSerializer

# Routers provide an easy way of automatically determining the URL conf.
router = routers.DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    path('auth/spotify/', auth.SpotifyLogin.as_view(), name='spotify_auth'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/me/', user.MeView.as_view(), name='me'),

    path('api/spotify/snapshot/', spotify.SnapshotView.as_view(), name='spotify_snapshot'),
    path('api/spotify/top-tracks/', spotify.TopTracksView.as_view(), name='spotify_top_tracks'),
    path('api/spotify/top-artists/', spotify.TopArtistsView.as_view(), name='spotify_top_artists'),
    path('api/spotify/top-albums/', spotify.TopAlbumsView.as_view(), name='spotify_top_albums'),
    path('api/spotify/top-genres/', spotify.TopGenresView.as_view(), name='spotify_top_genres'),
    path('api/spotify/playlists/', spotify.PlaylistsView.as_view(), name='spotify_playlists'),
    path('api/spotify/playlists/<str:playlist_id>/', spotify.PlaylistDetailView.as_view()),

    path('api/download/playlist/<str:playlist_id>/', download.DownloadPlaylist.as_view(), name='download-playlist'),
    path('api/download/status/<str:task_id>/', download.DownloadStatus.as_view(), name='download-status'),
    path('api/download/retrieve/<str:task_id>/', download.GetDownload.as_view(), name='get-download'),
]