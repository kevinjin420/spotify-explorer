import axios from "axios";
import type {
	UserProfile,
	TopArtist,
	TopTrack,
	TopAlbum,
	Genre,
	SnapshotData,
	Playlist,
} from "../types/spotify";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const getClient = () => {
	const token = localStorage.getItem("auth_token");
	if (!token) {
		throw new Error("No auth token found. Please log in again.");
	}

	return axios.create({
		baseURL: API_BASE_URL,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
	const client = getClient();
	const response = await client.get("/me/");
	return response.data;
};

export const fetchSnapshotData = async (): Promise<SnapshotData> => {
	const client = getClient();
	// This endpoint matches the new SnapshotView in your Django backend.
	const response = await client.get("/spotify/snapshot/");
	return response.data;
};

type TimeRange = "short_term" | "medium_term" | "long_term";

export const fetchTopTracks = async (
	timeRange: TimeRange
): Promise<TopTrack[]> => {
	const client = getClient();
	const response = await client.get("/spotify/top-tracks/", {
		params: { time_range: timeRange },
	});
	return response.data;
};

export const fetchTopArtists = async (
	timeRange: TimeRange
): Promise<TopArtist[]> => {
	const client = getClient();
	const response = await client.get("/spotify/top-artists/", {
		params: { time_range: timeRange },
	});
	return response.data;
};

export const fetchTopAlbums = async (
	timeRange: TimeRange
): Promise<TopAlbum[]> => {
	const client = getClient();
	const response = await client.get("/spotify/top-albums/", {
		params: { time_range: timeRange },
	});
	return response.data;
};

export const fetchTopGenres = async (
	timeRange: TimeRange
): Promise<Genre[]> => {
	const client = getClient();
	const response = await client.get("/spotify/top-genres/", {
		params: { time_range: timeRange },
	});
	return response.data;
};

export const fetchPlaylists = async (): Promise<Playlist[]> => {
	const client = getClient();
	const response = await client.get("/spotify/playlists/");
	return response.data;
};

export const fetchPlaylist = async (playlistId: string): Promise<Playlist> => {
	const client = getClient();
	const response = await client.get(`/spotify/playlists/${playlistId}`);
	return response.data;
};
