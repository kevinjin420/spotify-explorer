import { create } from 'zustand';
import type { UserProfile } from "../types/spotify";
import { saveTokens, removeTokens, getAccessToken } from '../services/authService';

type AuthState = {
  user: UserProfile | null;
  isLoggedIn: boolean;
  login: (user: UserProfile, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initialize: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,

  initialize: () => {
    try {
      const storedUser = localStorage.getItem('spotify_user');
      const accessToken = getAccessToken();
      if (storedUser && accessToken) {
        set({ user: JSON.parse(storedUser), isLoggedIn: true });
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('spotify_user');
      removeTokens();
      set({ user: null, isLoggedIn: false });
    }
  },

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('spotify_user', JSON.stringify(user));
    saveTokens(accessToken, refreshToken);
    set({ user, isLoggedIn: true });
  },

  logout: () => {
    localStorage.removeItem('spotify_user');
    removeTokens();
    set({ user: null, isLoggedIn: false });
  },
}));

useAuthStore.getState().initialize();
