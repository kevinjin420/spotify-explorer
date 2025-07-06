import { useAuth } from "../utils/useAuth";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  // Placeholder image if user has no profile pic (replace with real user data later)
  const profilePic = "https://i.pravatar.cc/40";

  const handleAuthClick = () => {
    navigate("/login"); // Or "/signup" based on your routes
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <nav className="bg-white dark:bg-black shadow-md static w-full z-50">
      <div className="max-w-7xl mx-auto px-5 py-3 flex justify-between items-center">
        <div
          className="text-3xl font-bold text-green-600 cursor-pointer"
          onClick={handleLogoClick}
          title="Go to Home"
        >
          SpotifyExplorer
        </div>

        <div className="flex items-center space-x-4">
          {!isLoggedIn ? (
            <button
              onClick={handleAuthClick}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Sign In/Up
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <img
                src={profilePic}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-green-500 cursor-pointer"
                onClick={() => logout()}
                title="Click to logout"
              />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
