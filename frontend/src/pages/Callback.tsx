import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../store/authStore";
import type { UserProfile } from "../types/spotify"; // Import the UserProfile type

// Constants remain the same
const clientId = "707e6669168b4e1c8259724099a059d9";
const redirectUri = "http://127.0.0.1:5173/callback";
const tokenUrl = "https://accounts.spotify.com/api/token";
const userProfileUrl = "https://api.spotify.com/v1/me";
const backendAuthUrl = "http://127.0.0.1:8000/auth/spotify/";

const Callback = () => {
	const navigate = useNavigate();
	const hasRun = useRef(false);
	const login = useAuthStore((state) => state.login);

	useEffect(() => {
		if (hasRun.current) return;
		hasRun.current = true;

		const exchangeToken = async () => {
			const code = new URLSearchParams(window.location.search).get(
				"code"
			);
			const verifier = localStorage.getItem("spotify_verifier");

			if (!code || !verifier) {
				navigate("/?error=missing_credentials");
				return;
			}

			try {
				// 1. Exchange code for token
				const tokenResponse = await axios.post(
					tokenUrl,
					new URLSearchParams({
						grant_type: "authorization_code",
						code,
						redirect_uri: redirectUri,
						code_verifier: verifier,
						client_id: clientId,
					}),
					{
						headers: {
							"Content-Type": "application/x-www-form-urlencoded",
						},
					}
				);
				const tokenData = tokenResponse.data;

				const userResponse = await axios.get(userProfileUrl, {
					headers: {
						Authorization: `Bearer ${tokenData.access_token}`,
					},
				});
				const userData = userResponse.data;

				const saveResponse = await axios.post(backendAuthUrl, {
					spotify_id: userData.id,
					display_name: userData.display_name,
					profile_image: userData.images?.[0]?.url || null,
					email: userData.email,
					access_token: tokenData.access_token,
					refresh_token: tokenData.refresh_token,
					token_expires_in: tokenData.expires_in,
					scope: tokenData.scope,
				});

				const userProfileForState: UserProfile = {
					spotify_id: userData.id,
					display_name: userData.display_name,
					profile_image: userData.images?.[0]?.url || null,
					email: userData.email,
				};
				login(userProfileForState, saveResponse.data.access, saveResponse.data.refresh);

				localStorage.removeItem("spotify_verifier");
				navigate("/dashboard");
			} catch (error) {
				if (axios.isAxiosError(error)) {
					console.error(
						"API Error:",
						error.response?.data || error.message
					);
					navigate(
						`/?error=${error.response?.data?.error || "api_failed"}`
					);
				} else {
					console.error("An unexpected error occurred:", error);
					navigate("/?error=unexpected");
				}
			}
		};

		exchangeToken();
	}, [navigate, login]);

	return (
		<div className="bg-black text-white min-h-screen flex items-center justify-center">
			<div className="text-center flex items-center gap-2">
				<p className="text-3xl font-semibold">Logging In with </p>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="32"
					height="32"
					fill="currentColor"
					className="bi bi-spotify"
					viewBox="0 0 16 16"
				>
					<path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m3.669 11.538a.5.5 0 0 1-.686.165c-1.879-1.147-4.243-1.407-7.028-.77a.499.499 0 0 1-.222-.973c3.048-.696 5.662-.397 7.77.892a.5.5 0 0 1 .166.686m.979-2.178a.624.624 0 0 1-.858.205c-2.15-1.321-5.428-1.704-7.972-.932a.625.625 0 0 1-.362-1.194c2.905-.881 6.517-.454 8.986 1.063a.624.624 0 0 1 .206.858m.084-2.268C10.154 5.56 5.9 5.419 3.438 6.166a.748.748 0 1 1-.434-1.432c2.825-.857 7.523-.692 10.492 1.07a.747.747 0 1 1-.764 1.288" />
				</svg>
			</div>
		</div>
	);
};

export default Callback;
