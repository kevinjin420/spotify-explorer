// src/components/Navbar.tsx
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { useAuth } from "../utils/useAuth";

const Navbar = () => {
	const { isLoggedIn, user, logout } = useAuth();
	const navigate = useNavigate();

	const handleAuthClick = () => {
		navigate("/login");
	};

	const handleLogoClick = () => {
		navigate("/");
	};

	const handleDashboardClick = () => {
		navigate("/dashboard");
	};

	return (
		<nav className="bg-gray-900 text-white shadow-md sticky top-0 w-full z-50">
			<div className="max-w-7xl mx-auto px-5 py-3 flex justify-between items-center">
				<div
					className="text-3xl font-bold text-green-400 cursor-pointer"
					onClick={handleLogoClick}
					title="Go to Home"
				>
					SpotifyExplorer
				</div>

				<div className="flex items-center space-x-4">
					{!isLoggedIn ? (
						<button
							onClick={handleAuthClick}
							className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-2xl transition duration-300"
						>
							Sign In
						</button>
					) : (
						<Menu
							as="div"
							className="relative inline-block text-left"
						>
							<div>
								<Menu.Button className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
									<span className="sr-only">
										Open user menu
									</span>
									<img
										className="w-10 h-10 rounded-full object-cover border-2 border-green-400"
										src={
											user?.profile_image ||
											"https://placehold.co/40x40/191414/FFFFFF?text=PFP"
										}
										alt="User profile"
									/>
								</Menu.Button>
							</div>

							<Transition
								as={Fragment}
								enter="transition ease-out duration-100"
								enterFrom="transform opacity-0 scale-95"
								enterTo="transform opacity-100 scale-100"
								leave="transition ease-in duration-75"
								leaveFrom="transform opacity-100 scale-100"
								leaveTo="transform opacity-0 scale-95"
							>
								<Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
									<Menu.Item>
										{({ active }) => (
											<a
												href="#"
												onClick={handleDashboardClick}
												className={`${
													active ? "bg-gray-700" : ""
												} block px-4 py-2 text-sm text-gray-200`}
											>
												Dashboard
											</a>
										)}
									</Menu.Item>
									<Menu.Item>
										{({ active }) => (
											<a
												href="#"
												onClick={logout}
												className={`${
													active ? "bg-gray-700" : ""
												} block px-4 py-2 text-sm text-gray-200`}
											>
												Logout
											</a>
										)}
									</Menu.Item>
								</Menu.Items>
							</Transition>
						</Menu>
					)}
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
