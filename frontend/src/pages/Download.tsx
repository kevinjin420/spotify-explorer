import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPlaylist } from "../services/spotifyService";
import {
	startDownloadPlaylist,
	getDownloadStatus,
	getDownloadedFile,
} from "../services/youtubeService";
import type { Playlist } from "../types/spotify";

export default function DownloadPage() {
	const { playlistId } = useParams<{ playlistId: string }>();
	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [taskId, setTaskId] = useState<string | null>(null);
	const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [totalTracks, setTotalTracks] = useState(0);

	useEffect(() => {
		if (!playlistId) return;

		const fetchPlaylistData = async () => {
			try {
				const data = await fetchPlaylist(playlistId);
				setPlaylist(data);
			} catch (err) {
				console.error("Failed to fetch playlist data:", err);
				setError("Failed to fetch playlist.");
			} finally {
				setLoading(false);
			}
		};

		fetchPlaylistData();
	}, [playlistId]);

	useEffect(() => {
		if (!taskId) return;

		const pollStatus = async () => {
			try {
				const statusData = await getDownloadStatus(taskId);
				setDownloadStatus(statusData.status);
				setDownloadProgress(statusData.completed);
				setTotalTracks(statusData.total);

				if (statusData.status === "COMPLETED") {
					const response = await getDownloadedFile(taskId);
					const blob = new Blob([response.data], { type: "application/zip" });
					const url = window.URL.createObjectURL(blob);
					const a = document.createElement("a");
					a.href = url;
					a.download = `${playlist?.name || "playlist"}.zip`;
					document.body.appendChild(a);
					a.click();
					a.remove();
					setTaskId(null); // Reset task ID after completion
				} else if (statusData.status === "FAILED") {
					setError("Download failed. Please try again.");
					setTaskId(null);
				}
			} catch (err) {
				console.error("Failed to get download status:", err);
				setError("Failed to get download status.");
				setTaskId(null);
			}
		};

		const interval = setInterval(pollStatus, 3000);
		return () => clearInterval(interval);
	}, [taskId, playlist?.name]);

	const startDownload = async () => {
		if (!playlistId) return;
		setError(null);
		setDownloadStatus("PENDING");
		try {
			const taskData = await startDownloadPlaylist(playlistId);
			setTaskId(taskData.task_id);
		} catch (err) {
			console.error("Failed to start download:", err);
			setError("Failed to start download.");
			setDownloadStatus(null);
		}
	};

	if (loading) return <div>Loading playlist...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!playlist) return <div>No playlist found.</div>;

	const isDownloading = downloadStatus && !['COMPLETED', 'FAILED'].includes(downloadStatus);

	return (
		<div className="p-8 bg-black text-white min-h-screen">
			<div className="max-w-4xl mx-auto">
				<div className="mb-8 flex flex-row justify-between items-center">
					<h1 className="text-4xl font-bold mb-2">{playlist.name}</h1>
					<div className="flex flex-col items-end">
						<button
							onClick={startDownload}
							disabled={!!isDownloading}
							className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-3 rounded cursor-pointer disabled:bg-gray-500"
						>
							{isDownloading ? `Downloading...` : "Download All Tracks"}
						</button>
						{isDownloading && (
							<p className="text-sm text-gray-400 mt-2">
								{downloadProgress} of {totalTracks} tracks downloaded.
							</p>
						)}
					</div>
				</div>

				<div className="mt-8 border-2 border-green-400 rounded-xl p-2">
					<div className="grid grid-cols-12 gap-2 text-green-400 border-b border-green-400 px-2 pb-2 mb-2">
						<div className="col-span-1">#</div>
						<div className="col-span-6">Title</div>
						<div className="col-span-5">Artist</div>
					</div>

					{playlist.tracks.items.map((item, index) => (
						<div
							key={item.track.id}
							className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg"
						>
							<div className="col-span-1 text-gray-300">{index + 1}</div>
							<div className="col-span-6 font-semibold">{item.track.name}</div>
							<div className="col-span-5 text-gray-400">
								{item.track.artists.map((artist) => artist.name).join(", ")}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}