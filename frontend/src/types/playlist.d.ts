export interface Track {
	id: number;
	name: string;
	artist: string;
}

export interface Playlist {
	id: string;
	name: string;
	tracks: Track[];
}