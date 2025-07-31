export interface Track {
	id: string;
	name: string;
	artists: string[];
}

export interface Playlist {
	id: string;
	name: string;
	tracks: Track[];
}

export interface PlaylistItem {
	track: Track;
}

export interface Artist {
	id: string;
	name: string;
	type: string;
}