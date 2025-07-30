import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPlaylist } from "../services/spotifyService";
import { downloadPlaylist } from "../services/youtubeService";
import type { Playlist } from "../types/playlist";

export default function DownloadPage() {
	const { playlistId } = useParams<{ playlistId: string }>();
	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	const [downloading, setDownloading] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [downloadProgress, setDownloadProgress] = useState(0);
	const [totalTracks, setTotalTracks] = useState(0);

	useEffect(() => {
		if (!playlistId) return;

		const fetchPlaylistData = async () => {
			try {
				const data = await fetchPlaylist(playlistId);

				const extractedTracks = data.tracks.items.map((item: any) => ({
					id: item.track.id,
					name: item.track.name,
					artist: item.track.artists.map((a: any) => a.name).join(", "),
				}));

				const structuredPlaylist: Playlist = {
					id: data.id,
					name: data.name,
					tracks: extractedTracks,
				};

				setPlaylist(structuredPlaylist);
				setTotalTracks(extractedTracks.length);
			} catch (err) {
				console.error("Failed to fetch playlist data:", err);
				setError("Failed to fetch playlist.");
			} finally {
				setLoading(false);
			}
		};

		fetchPlaylistData();
	}, [playlistId]);

	const downloadAll = async () => {
		if (!playlistId || !playlist) return;
		setDownloading(true);
		setDownloadProgress(0);

		try {
			const response = await downloadPlaylist(playlistId);
			const blob = new Blob([response.data], { type: 'application/zip' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${playlist?.name || 'playlist'}.zip`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setDownloadProgress(totalTracks);
		} catch (err) {
			console.error("Failed to download playlist:", err);
			setError("Failed to download playlist.");
		} finally {
			setDownloading(false);
		}
	};

	if (loading) return <div>Loading playlist...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!playlist) return <div>No playlist found.</div>;

	return (
    <div className="p-8 bg-black text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-row justify-between items-center">
          <h1 className="text-4xl font-bold mb-2">{playlist.name}</h1>
          <div className="flex flex-col items-end">
            <button
              onClick={downloadAll}
              disabled={downloading}
              className="bg-green-500 hover:bg-green-600 text-black font-bold px-6 py-3 rounded cursor-pointer"
            >
              {downloading ? "Downloading..." : "Download All Tracks"}
            </button>
            {downloading && (
              <p className="text-sm text-gray-400 mt-2">
                Downloading {downloadProgress} of {totalTracks} tracks...
              </p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <div className="grid grid-cols-12 gap-4 text-gray-400 border-b border-gray-700 pb-2 mb-4">
            <div className="col-span-1">#</div>
            <div className="col-span-5">TITLE</div>
            <div className="col-span-6">ARTIST</div>
          </div>

          {playlist.tracks.map((track, index) => (
            <div key={track.id} className="grid grid-cols-12 gap-4 items-center py-2 hover:bg-gray-800 rounded-lg">
              <div className="col-span-1 text-gray-400">{index + 1}</div>
              <div className="col-span-5 font-semibold">{track.name}</div>
              <div className="col-span-6 text-gray-400">{track.artist}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
	);
}
