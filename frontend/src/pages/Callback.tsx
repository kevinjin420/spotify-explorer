// src/pages/Callback.tsx
import { useEffect } from "react";

const clientId = "707e6669168b4e1c8259724099a059d9";
const redirectUri = "http://127.0.0.1:5173/callback";

const Callback = () => {
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
      // store token or redirect to dashboard
    };

    exchangeToken();
  }, []);

  return <p className="p-6">Logging in...</p>;
};

export default Callback;
