// src/pages/Callback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const clientId = "707e6669168b4e1c8259724099a059d9";
const redirectUri = "http://127.0.0.1:5173/callback";

const Callback = () => {
  const navigate = useNavigate();

	useEffect(() => {
		const code = new URLSearchParams(window.location.search).get("code");
		const verifier = localStorage.getItem("spotify_verifier");

		const exchangeToken = async () => {
			if (!code || !verifier) return;

			const body = new URLSearchParams({
				client_id: clientId,
				grant_type: "authorization_code",
				code,
				redirect_uri: redirectUri,
				code_verifier: verifier,
			});

			const res = await fetch("https://accounts.spotify.com/api/token", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body,
			});

			const data = await res.json();
			console.log("Token Response:", data);

			const userRes = await fetch("https://api.spotify.com/v1/me", {
				headers: {
					Authorization: `Bearer ${data.access_token}`,
				},
			});
			const userData = await userRes.json();
			console.log(userData.id, userData.display_name);

			// Send to your backend
			const saveRes = await fetch("http://127.0.0.1:8000/save-spotify-token/", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					// optionally add Authorization if you're using JWT/session auth
				},
				body: JSON.stringify({
					spotify_id: userData.id,
					display_name: userData.display_name,
					profile_image: userData.images?.[0]?.url || null,
					email: userData.email,
					access_token: data.access_token,
					refresh_token: data.refresh_token,
					expires_in: data.expires_in,
					scope: data.scope,
				}),
			});

      const saveData = await saveRes.json();

      if (saveRes.ok) {	
        localStorage.setItem("auth_token", saveData.token);
        navigate("/dashboard");
      } else {
        console.error("Error saving data:", saveData.error);
        navigate("/login"); 
      }
		};


		exchangeToken();
	}, [navigate]);

	return (
		<p className="text-3xl p-6 text-black dark:text-white flex flex-col items-center justify-center">
			Logging in...
		</p>
	);
};

export default Callback;
