// src/components/Navbar.tsx
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import {
	Menu,
	Transition,
	MenuButton,
	MenuItem,
	MenuItems,
} from "@headlessui/react";
import { Square2StackIcon, PowerIcon, ChartBarIcon } from "@heroicons/react/16/solid";
import { useAuthStore } from "../store/authStore";
import { generateCodeVerifier, generateCodeChallenge } from "../utils/pkce.ts";

const clientId = "707e6669168b4e1c8259724099a059d9";
const redirectUri = `http://127.0.0.1:5173/callback`;
const scope = [
	"user-read-email",
	"user-read-private",
	"user-top-read",
	"playlist-read-private",
	"playlist-read-collaborative",
].join(" ");

const Navbar = () => {
	const { user, isLoggedIn, logout } = useAuthStore();
	const navigate = useNavigate();

	const handleLogoClick = () => {
		navigate("/");
	};

	const handleDashboardClick = () => {
		navigate("/dashboard");
	};

	const handleStatsClick = () => {
		navigate("/stats");
	};

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

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	return (
		<nav className="bg-black sticky top-0 w-full z-50 border-b-2 border-b-green-400">
			<div className="max-w-7xl mx-auto p-3 flex justify-between items-center">
				<div
					className="text-3xl font-bold text-green-400 cursor-pointer"
					onClick={handleLogoClick}
				>
					SpotifyExplorer
				</div>

				<div className="flex items-center space-x-4">
					{!isLoggedIn ? (
						<button
							onClick={handleLogin}
							className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded transition duration-300 cursor-pointer"
						>
							Sign In
						</button>
					) : (
						<Menu
							as="div"
							className="relative inline-block text-left"
						>
							<MenuButton className="flex text-sm rounded-full focus:outline-none cursor-pointer">
								<img
									className="w-10 h-10 rounded-full object-cover border-2 border-green-400"
									src={
										user?.profile_image ||
										"placeholder.svg"
									}
								/>
							</MenuButton>

							<Transition
								as={Fragment}
								enter="transition ease-out duration-100"
								enterFrom="transform opacity-0 scale-95"
								enterTo="transform opacity-100 scale-100"
								leave="transition ease-in duration-75"
								leaveFrom="transform opacity-100 scale-100"
								leaveTo="transform opacity-0 scale-95"
							>
								<MenuItems className="origin-top-right absolute right-0 mt-1 rounded-md shadow-lg bg-black focus:outline-none border-2 border-green-400 w-auto">
									<MenuItem>
										<button
											onClick={handleDashboardClick}
											className="px-3 py-2 text-sm text-green-400 font-bold w-full text-left cursor-pointer flex"
										>
											<Square2StackIcon className="size-5 fill-green-400 me-2" />
											Dashboard
										</button>
									</MenuItem>
									<MenuItem>
										<button
											onClick={handleStatsClick}
											className="px-3 py-2 text-sm text-green-400 font-bold w-full text-left cursor-pointer flex"
										>
											<ChartBarIcon className="size-5 fill-green-400 me-2" />
											Stats
										</button>
									</MenuItem>
									<MenuItem>
										<button
											onClick={handleLogout}
											className="px-3 py-2 text-sm text-green-400 font-bold w-full text-left cursor-pointer flex"
										>
											<PowerIcon className="size-5 fill-green-400 me-2" />
											Logout
										</button>
									</MenuItem>
								</MenuItems>
							</Transition>
						</Menu>
					)}
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
