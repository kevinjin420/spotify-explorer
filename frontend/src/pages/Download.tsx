import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchPlaylist } from "../services/spotifyService";
import type { Playlist } from "../types/playlist"

export default function DownloadPage() {
	const { playlistId } = useParams<{ playlistId: string }>();
	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	const [downloading, setDownloading] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!playlistId) return;

		const fetchPlaylistData = async () => {
			try {
				const data = await fetchPlaylist(playlistId);
        console.log(data)

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
		if (!playlist) return;
	};

	if (loading) return <div>Loading playlist...</div>;
	if (error) return <div>Error: {error}</div>;
	if (!playlist) return <div>No playlist found.</div>;

	return (
    <div className="p-4">
      <h1 className="text-white">On Playlist: {playlistId}</h1>
      <h2 className="text-xl font-semibold mb-2 text-white">
        Downloading: {playlist.name}
      </h2>
      <button
        onClick={downloadAll}
        disabled={downloading}
        className="bg-green-400 text-black font-bold px-4 py-2 rounded cursor-pointer"
      >
        {downloading ? "Downloading..." : "Download All Tracks"}
      </button>
      <ul className="mt-4 text-white">
        {playlist.tracks.map((track) => (
          <li key={track.id} className="mb-2">
            <span className="font-semibold">{track.name}</span> by {track.artist}
          </li>
        ))}
      </ul>
    </div>
	);
}
