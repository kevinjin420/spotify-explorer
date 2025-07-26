from django.urls import path, include
from django.contrib.auth.models import User
from django.contrib import admin
from rest_framework import routers, serializers, viewsets
from explorer.explorer import views

# Serializers define the API representation.
class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'is_staff']

# ViewSets define the view behavior.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# Routers provide an easy way of automatically determining the URL conf.
router = routers.DefaultRouter()
router.register(r'users', UserViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    path('auth/spotify/', views.SpotifyUserView.as_view(), name='spotify_auth'),
    path('api/me/', views.MeView.as_view(), name='me'),

    path('api/spotify/snapshot/', views.SnapshotView.as_view(), name='spotify_snapshot'),
    path('api/spotify/top-tracks/', views.TopTracksView.as_view(), name='spotify_top_tracks'),
    path('api/spotify/top-artists/', views.TopArtistsView.as_view(), name='spotify_top_artists'),
    path('api/spotify/top-albums/', views.TopAlbumsView.as_view(), name='spotify_top_albums'),
    path('api/spotify/top-genres/', views.TopGenresView.as_view(), name='spotify_top_genres'),
    path('api/spotify/playlists/', views.PlaylistsView.as_view(), name='spotify_playlists'),
    path('api/spotify/playlists/<str:playlist_id>/', views.PlaylistDetailView.as_view()),
    path('api/download/', views.DownloadTrack.as_view(), name='download_track'),
]