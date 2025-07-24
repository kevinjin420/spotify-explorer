import { create } from 'zustand';
import type { UserProfile } from "../types/spotify";

type AuthState = {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (user: UserProfile) => void;
  logout: () => void;
  initialize: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,

  // New initialize function
  // This will run when the app loads to check if the user is already logged in.
  initialize: () => {
    try {
      const storedUser = localStorage.getItem('spotify_user');
      if (storedUser) {
        set({ user: JSON.parse(storedUser), isLoggedIn: true });
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      // If parsing fails, ensure the user is logged out
      localStorage.removeItem('spotify_user');
      set({ user: null, isLoggedIn: false });
    }
  },

  login: (user) => {
    localStorage.setItem('spotify_user', JSON.stringify(user));
    set({ user, isLoggedIn: true });
  },

  logout: () => {
    // Clear all relevant items from localStorage
    localStorage.removeItem('spotify_user');
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_verifier');
    localStorage.removeItem('auth_token'); // Also remove the backend token
    // Reset the state
    set({ user: null, isLoggedIn: false });
  },
}));

// Initialize the store's state as soon as the app loads.
useAuthStore.getState().initialize();
