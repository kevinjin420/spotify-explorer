// src/context/AuthContext.ts
import { createContext } from "react";

// Define the shape of the user profile data
export interface UserProfile {
    spotify_id: string;
    display_name: string;
    email: string;
    profile_image: string | null;
}

// Define the shape of our context
export interface AuthContextType {
    isLoggedIn: boolean;
    user: UserProfile | null;
    loading: boolean; // To handle initial auth check
    logout: () => void;
}

// Create the context with a default undefined value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
