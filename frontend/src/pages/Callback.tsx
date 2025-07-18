// src/pages/Callback.tsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; 

// Constants remain the same
const clientId = "707e6669168b4e1c8259724099a059d9";
const redirectUri = "http://127.0.0.1:5173/callback";
const tokenUrl = "https://accounts.spotify.com/api/token";
const userProfileUrl = "https://api.spotify.com/v1/me";
const backendAuthUrl = "http://127.0.0.1:8000/auth/spotify/";

const Callback = () => {
    const navigate = useNavigate();
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const exchangeToken = async () => {
            const code = new URLSearchParams(window.location.search).get("code");
            const verifier = localStorage.getItem("spotify_verifier");

            if (!code || !verifier) {
                navigate("/login?error=missing_credentials");
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
                    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
                );
                const tokenData = tokenResponse.data;
				console.log(tokenData)

                // 2. Fetch user profile
                const userResponse = await axios.get(userProfileUrl, {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` },
                });
                const userData = userResponse.data;

                // 3. Send complete data to your backend
                // Axios automatically stringifies the object and sets Content-Type to application/json
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
                
                // Success!
                localStorage.setItem("auth_token", saveResponse.data.token);
                localStorage.removeItem("spotify_verifier");
                navigate("/dashboard");

            } catch (error) {
                // Axios automatically rejects on 4xx/5xx errors, so all errors land here
                if (axios.isAxiosError(error)) {
                    console.error("API Error:", error.response?.data || error.message);
                    navigate(`/login?error=${error.response?.data?.error || 'api_failed'}`);
                } else {
                    console.error("An unexpected error occurred:", error);
                    navigate("/login?error=unexpected");
                }
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