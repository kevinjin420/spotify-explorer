import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import type { TopTrack, TopArtist, TopAlbum, Playlist } from "../types/spotify";
import {
	ArrowDownTrayIcon,
	LinkIcon,
} from "@heroicons/react/24/outline";
import {
	Popover,
	PopoverButton,
	PopoverPanel,
	Transition,
} from "@headlessui/react";
import { useAuthStore } from "../store/authStore";

import { fetchSnapshotData, fetchPlaylists } from "../services/spotifyService";

const Disclaimer = ({ text }: { text: string }) => (
	<Popover className="relative flex items-center">
		<PopoverButton className="ml-1 text-base leading-none text-green-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500 rounded-full">
			*
		</PopoverButton>
		<Transition
			as={Fragment}
			enter="transition ease-out duration-200"
			enterFrom="opacity-0 translate-y-1"
			enterTo="opacity-100 translate-y-0"
			leave="transition ease-in duration-150"
			leaveFrom="opacity-100 translate-y-0"
			leaveTo="opacity-0 translate-y-1"
		>
			<PopoverPanel className="absolute bottom-full left-1/2 z-10 w-[240px] -translate-x-1/2 p-2 mb-2 focus:outline-none text-center text-sm text-green-400 font-normal bg-black border-2 border-green-400 rounded-lg">
				{text}
			</PopoverPanel>
		</Transition>
	</Popover>
);

const Dashboard = () => {
	const { logout } = useAuthStore();
	const navigate = useNavigate();
	const [topTracks, setTopTracks] = useState<TopTrack[]>([]);
	const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
	const [topAlbums, setTopAlbums] = useState<TopAlbum[]>([]);
	const [topGenres, setTopGenres] = useState<string[]>([]);
	const [playlists, setPlaylists] = useState<Playlist[]>([]);

	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				const [snapshot, playlistsData] = await Promise.all([
					fetchSnapshotData(),
					fetchPlaylists(),
				]);

				setTopTracks(snapshot.top_tracks);
				setTopArtists(snapshot.top_artists);
				setTopAlbums(snapshot.top_albums);
				setTopGenres(snapshot.top_genres);
				setPlaylists(playlistsData);
			} catch (err) {
				console.error("Failed to fetch dashboard data:", err);
				setError("Your session may have expired. Please log in again.");
				logout();
				navigate("/");
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [navigate, logout]);

	const handleDownload = (playlist: Playlist) => {
		navigate(`/download/${playlist.id}`);
	};

	if (loading) {
		return (
			<div className="wrapper flex items-center justify-center h-screen bg-black text-white">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500 mx-auto"></div>
					<p className="text-xl mt-4">Loading Your Snapshot...</p>
				</div>
			</div>
		);
	}
	if (error) {
		return (
			<div className="wrapper flex items-center justify-center h-screen bg-black text-red-500">
				<div className="text-2xl">{error}</div>
			</div>
		);
	}

	return (
		<div className="wrapper h-full w-full bg-black text-white p-4">
			<div className="max-w-7xl mx-auto">
				<h2 className="text-3xl font-bold text-green-400 mb-3">
					Your 4-Week Snapshot
				</h2>

				<div className="flex flex-wrap border-2 border-green-400 rounded-xl p-2">
					{/* Top Tracks Column */}
					<div className="w-full md:w-1/2 lg:w-1/4 px-2 mb-2">
						<h3 className="text-xl font-semibold text-green-400 mb-2">
							Top Tracks
						</h3>
						<div className="bg-black border-2 border-green-400 rounded-lg py-1">
							{topTracks.map((track, index) => (
								<div
									key={track.id}
									className="flex items-center px-3 py-2"
								>
									<span className="text-lg font-bold text-gray-400 w-6">
										{index + 1}.
									</span>
									<img
										src={
											track.album.images?.[0]?.url ||
											"https://placehold.co/48x48/191414/FFFFFF?text=🎵"
										}
										alt={track.name}
										className="w-12 h-12 rounded-md object-cover mx-3"
									/>
									<div className="flex-1 truncate">
										<p className="font-bold text-white truncate">
											{track.name}
										</p>
										<p className="text-sm text-gray-400 truncate">
											{track.artists
												.map((a) => a.name)
												.join(", ")}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Top Artists Column */}
					<div className="w-full md:w-1/2 lg:w-1/4 px-2 mb-2 min-w-[">
						<h3 className="text-xl font-semibold text-green-400 mb-2">
							Top Artists
						</h3>
						<div className="bg-black border-2 border-green-400 rounded-lg py-1">
							{topArtists.map((artist, index) => (
								<div
									key={artist.id}
									className="flex items-center px-3 py-2"
								>
									<span className="text-lg font-bold text-gray-400 w-6">
										{index + 1}.
									</span>
									<img
										src={
											artist.images?.[0]?.url ||
											"https://placehold.co/48x48/191414/FFFFFF?text=👤"
										}
										alt={artist.name}
										className="w-12 h-12 rounded-full object-cover mx-3"
									/>
									<div className="flex-1 truncate">
										<p className="font-bold text-white truncate">
											{artist.name}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Top Albums Column */}
					<div className="w-full md:w-1/2 lg:w-1/4 px-2 mb-2">
						<h3 className="text-xl font-semibold text-green-400 mb-2 flex items-center">
							Top Albums
							<Disclaimer text="Calculated from your top 50 artists" />
						</h3>
						<div className="bg-black border-2 border-green-400 rounded-lg py-1">
							{topAlbums.map((album, index) => (
								<div
									key={album.id}
									className="flex items-center px-3 py-2"
								>
									<span className="text-lg font-bold text-gray-400 w-6">
										{index + 1}.
									</span>
									<img
										src={
											album.images?.[0]?.url ||
											"https://placehold.co/48x48/191414/FFFFFF?text=💿"
										}
										alt={album.name}
										className="w-12 h-12 rounded-md object-cover mx-3"
									/>
									<div className="flex-1 truncate">
										<p className="font-bold text-white truncate">
											{album.name}
										</p>
										<p className="text-sm text-gray-400 truncate">
											{album.artists
												.map((a) => a.name)
												.join(", ")}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Top Genres Column */}
					<div className="w-full md:w-1/2 lg:w-1/4 px-2 mb-2">
						<h3 className="text-xl font-semibold text-green-400 mb-2 flex items-center">
							Top Genres
							<Disclaimer text="Calculated from your top 50 artists" />
						</h3>
						<div className="bg-black border-2 border-green-400 rounded-lg py-1">
							{topGenres.map((genre, index) => (
								<div
									key={genre}
									className="flex items-center px-3 py-2 h-[64px]"
								>
									<span className="text-lg font-bold text-gray-400 w-8">
										{index + 1}.
									</span>
									<p className="font-bold text-white capitalize ml-3">
										{genre}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="mt-3">
					<h2 className="text-3xl font-bold text-green-400 mb-3">
						Your Playlists ({playlists.length})
					</h2>
					<div className="max-h-[40vh] overflow-y-auto pt-1 border-2 border-green-400 rounded-xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
						{playlists.map((playlist) => (
							<div
								key={playlist.id}
								className="flex items-center px-3 py-2 rounded-lg"
							>
								<img
									src={
										playlist.images?.[0]?.url ||
										"https://placehold.co/64x64/191414/FFFFFF?text=🎵"
									}
									alt={playlist.name}
									className="w-16 h-16 rounded-md object-cover mr-4"
								/>
								<div className="flex-1 truncate">
									<p className="font-bold text-white truncate text-lg">
										{playlist.name}
									</p>
									<p className="text-sm text-gray-400">
										{playlist.tracks.total} tracks
									</p>
								</div>
								{/* --- Action Icons --- */}
								<div className="flex items-center space-x-4 pr-4">
									<a
										href={playlist.external_urls.spotify}
										target="_blank"
										rel="noopener noreferrer"
										title="Open in Spotify"
										className="text-green-400 hover:text-white transition-colors cursor-pointer"
									>
										<LinkIcon className="h-6 w-6" />
									</a>
									<button
										title="Download"
										onClick={() => handleDownload(playlist)}
										className="text-green-400 hover:text-white transition-colors cursor-pointer"
									>
										<ArrowDownTrayIcon className="h-6 w-6" />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;
