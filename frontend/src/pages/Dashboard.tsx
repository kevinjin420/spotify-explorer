// src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// --- TypeScript Interfaces for our data ---
interface UserProfile {
	spotify_id: string;
	display_name: string;
	email: string;
	profile_image: string | null;
}

interface SpotifyImage {
	url: string;
	height: number;
	width: number;
}

interface TopTrack {
	name: string;
	artists: { name: string }[];
	album: { images: SpotifyImage[] };
	external_urls: { spotify: string };
}

interface TopArtist {
	name: string;
	images: SpotifyImage[];
	external_urls: { spotify: string };
}

interface Playlist {
	id: string;
	name: string;
	images: SpotifyImage[];
	tracks: { total: number };
	external_urls: { spotify: string };
}

// --- API Endpoints ---
const API_BASE_URL = "http://127.0.0.1:8000/api";
const API_ME_URL = `${API_BASE_URL}/me/`;
const API_TOP_ITEMS_URL = `${API_BASE_URL}/spotify/top-items/`;
const API_PLAYLISTS_URL = `${API_BASE_URL}/spotify/playlists/`;

const Dashboard = () => {
	const navigate = useNavigate();

	// --- State Management ---
	const [user, setUser] = useState<UserProfile | null>(null);
	const [topTrack, setTopTrack] = useState<TopTrack | null>(null);
	const [topArtist, setTopArtist] = useState<TopArtist | null>(null);
	const [topGenre, setTopGenre] = useState<string | null>(null);
	const [playlists, setPlaylists] = useState<Playlist[]>([]);

	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDashboardData = async () => {
			const token = localStorage.getItem("auth_token");
			if (!token) {
				navigate("/login");
				return;
			}

			// Create an axios instance with the auth header to reuse
			const apiClient = axios.create({
				headers: { Authorization: `Bearer ${token}` },
			});

			try {
				// Fetch all data concurrently for better performance
				const [meResponse, topItemsResponse, playlistsResponse] =
					await Promise.all([
						apiClient.get(API_ME_URL),
						apiClient.get(API_TOP_ITEMS_URL),
						apiClient.get(API_PLAYLISTS_URL),
					]);

				// Set state with the fetched data
				setUser(meResponse.data);
				setTopTrack(topItemsResponse.data.top_track);
				setTopArtist(topItemsResponse.data.top_artist);
				setTopGenre(topItemsResponse.data.top_genre);
				setPlaylists(playlistsResponse.data);
			} catch (err) {
				console.error("Failed to fetch dashboard data:", err);
				setError(
					"Your session has expired or failed. Please log in again."
				);
				localStorage.removeItem("auth_token");
				navigate("/login");
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [navigate]);

	const handleLogout = () => {
		localStorage.removeItem("auth_token");
		navigate("/login");
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-gray-900 text-white">
				<div className="text-2xl">Loading Dashboard...</div>
			</div>
		);
	}
	if (error) {
		return (
			<div className="flex items-center justify-center h-screen bg-gray-900 text-white">
				<div className="text-2xl text-red-500">{error}</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
			<div className="max-w-7xl mx-auto">
				<header className="flex justify-between items-center mb-10">
					<h1 className="text-4xl font-bold text-green-400">
						Dashboard
					</h1>
					<button
						onClick={handleLogout}
						className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
					>
						Logout
					</button>
				</header>

				{user && (
					<div className="bg-gray-800 p-8 rounded-xl shadow-lg flex flex-col sm:flex-row items-center gap-8 mb-10">
						<img
							src={
								user.profile_image ||
								"https://placehold.co/150x150/1DB954/FFFFFF?text=PFP"
							}
							alt="Profile"
							className="w-36 h-36 rounded-full border-4 border-green-400 object-cover"
						/>
						<div className="text-center sm:text-left">
							<h2 className="text-4xl font-bold">
								{user.display_name}
							</h2>
							<p className="text-lg text-gray-400 mt-2">
								{user.email}
							</p>
						</div>
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Left Column: Stats */}
					<div className="lg:col-span-1 space-y-8">
						<h3 className="text-2xl font-semibold mb-4">
							Your Top Items
						</h3>
						{topArtist && (
							<a
								href={topArtist.external_urls.spotify}
								target="_blank"
								rel="noopener noreferrer"
								className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 hover:bg-gray-700 transition-colors"
							>
								<img
									src={topArtist.images[0]?.url}
									alt={topArtist.name}
									className="w-20 h-20 rounded-full object-cover"
								/>
								<div>
									<p className="text-gray-400 text-sm">
										Top Artist
									</p>
									<p className="font-bold text-lg">
										{topArtist.name}
									</p>
								</div>
							</a>
						)}
						{topTrack && (
							<a
								href={topTrack.external_urls.spotify}
								target="_blank"
								rel="noopener noreferrer"
								className="bg-gray-800 p-4 rounded-lg flex items-center gap-4 hover:bg-gray-700 transition-colors"
							>
								<img
									src={topTrack.album.images[0]?.url}
									alt={topTrack.name}
									className="w-20 h-20 rounded-md object-cover"
								/>
								<div>
									<p className="text-gray-400 text-sm">
										Top Track
									</p>
									<p className="font-bold text-lg">
										{topTrack.name}
									</p>
									<p className="text-gray-400">
										{topTrack.artists
											.map((a) => a.name)
											.join(", ")}
									</p>
								</div>
							</a>
						)}
						{topGenre && (
							<div className="bg-gray-800 p-4 rounded-lg">
								<p className="text-gray-400 text-sm">
									Top Genre
								</p>
								<p className="font-bold text-lg capitalize">
									{topGenre}
								</p>
							</div>
						)}
					</div>

					{/* Right Column: Playlists */}
					<div className="lg:col-span-2">
						<h3 className="text-2xl font-semibold mb-4">
							Your Playlists ({playlists.length})
						</h3>
						<div className="bg-gray-800 p-4 rounded-lg h-[60vh] overflow-y-auto space-y-3">
							{playlists.map((playlist) => (
								<a
									href={playlist.external_urls.spotify}
									target="_blank"
									rel="noopener noreferrer"
									key={playlist.id}
									className="flex items-center p-3 rounded-md hover:bg-gray-700 transition-colors"
								>
									<img
										src={
											playlist.images[0]?.url ||
											"https://placehold.co/64x64/1DB954/FFFFFF?text=🎵"
										}
										alt={playlist.name}
										className="w-16 h-16 rounded-md object-cover mr-4"
									/>
									<div className="flex-grow">
										<p className="font-semibold text-white">
											{playlist.name}
										</p>
										<p className="text-sm text-gray-400">
											{playlist.tracks.total} tracks
										</p>
									</div>
								</a>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
