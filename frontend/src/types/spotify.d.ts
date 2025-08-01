export interface Image {
  url: string;
  height: number | null;
  width: number | null;
}

export interface ExternalUrls {
  spotify: string;
}

export interface Artist {
  name: string;
  external_urls: ExternalUrls;
}

// Existing types
export interface UserProfile {
  spotify_id: string;
  display_name: string;
  profile_image: string | null;
  email: string;
}

export interface TopTrack {
  id: string;
  name: string;
  artists: Artist[];
  album: TopAlbum;
  external_urls: ExternalUrls;
}

export interface TopArtist {
  id: string;
  name: string;
  images: Image[];
  external_urls: ExternalUrls;
  genres: string[];
}

export interface Playlist {
  id: string;
  name: string;
  images: Image[];
  tracks: {
    items: PlaylistItem[];
    total: number;
  };
  external_urls: ExternalUrls;
}

export interface PlaylistItem {
	track: TopTrack;
}

export interface TopAlbum {
  id: string;
  name:string;
  artists: Artist[];
  images: Image[];
  external_urls: ExternalUrls;
  count?: number;
}

export interface Genre {
  genre: string;
  count: number;
}

export interface SnapshotData {
    top_tracks: TopTrack[];
    top_artists: TopArtist[];
    top_genres: string[];
    top_albums: TopAlbum[];
}
