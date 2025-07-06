// src/pages/Login.tsx
import { generateCodeVerifier, generateCodeChallenge } from "../utils/pkce.ts";

const clientId = "707e6669168b4e1c8259724099a059d9";
const redirectUri = `http://127.0.0.1:5173/callback`;;
const scope = "user-read-private user-read-email";

const Login = () => {
  const handleLogin = async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("spotify_verifier", verifier);

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("scope", scope);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("code_challenge", challenge);
    window.location.href = authUrl.toString();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-600 text-white">
      <h1 className="text-3xl mb-6 font-bold">Spotify Explorer</h1>
      <button
        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-opacity-80 transition cursor-pointer"
        onClick={handleLogin}
      >
        Log in with Spotify
      </button>
    </div>
  );
};

export default Login;
