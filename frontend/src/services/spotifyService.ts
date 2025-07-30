import { api } from "./authService";
import type {
	UserProfile,
	TopArtist,
	TopTrack,
	TopAlbum,
	Genre,
	SnapshotData,
	Playlist,
} from "../types/spotify";

export const fetchUserProfile = async (): Promise<UserProfile> => {
	const response = await api.get("/me/");
	return response.data;
};

export const fetchSnapshotData = async (): Promise<SnapshotData> => {
	const response = await api.get("/spotify/snapshot/");
	return response.data;
};

type TimeRange = "short_term" | "medium_term" | "long_term";

export const fetchTopTracks = async (
	timeRange: TimeRange
): Promise<TopTrack[]> => {
	const response = await api.get("/spotify/top-tracks/", {
		params: { time_range: timeRange },
	});
	return response.data;
};

export const fetchTopArtists = async (
	timeRange: TimeRange
): Promise<TopArtist[]> => {
	const response = await api.get("/spotify/top-artists/", {
		params: { time_range: timeRange },
	});
	return response.data;
};

export const fetchTopAlbums = async (
	timeRange: TimeRange
): Promise<TopAlbum[]> => {
	const response = await api.get("/spotify/top-albums/", {
		params: { time_range: timeRange },
	});
	return response.data;
};

export const fetchTopGenres = async (
	timeRange: TimeRange
): Promise<Genre[]> => {
	const response = await api.get("/spotify/top-genres/", {
		params: { time_range: timeRange },
	});
	return response.data;
};

export const fetchPlaylists = async (): Promise<Playlist[]> => {
	const response = await api.get("/spotify/playlists/");
	return response.data;
};

export const fetchPlaylist = async (playlistId: string): Promise<Playlist> => {
	const response = await api.get(`/spotify/playlists/${playlistId}`);
	return response.data;
};

