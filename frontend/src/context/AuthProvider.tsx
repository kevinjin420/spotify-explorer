// src/context/AuthProvider.tsx
import { useState, useEffect, type ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext, type UserProfile } from "./AuthContext";

const API_ME_URL = "http://127.0.0.1:8000/api/me/";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    // This function fetches user data if a token exists.
    // useCallback ensures it's not recreated on every render.
    const verifyUser = useCallback(async () => {
        if (token) {
            try {
                const response = await axios.get(API_ME_URL, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setUser(response.data);
            } catch (error) {
                // If token is invalid, clear it
                console.error("Token verification failed:", error);
                localStorage.removeItem('auth_token');
                setToken(null);
                setUser(null);
            }
        }
        setLoading(false);
    }, [token]);

    // Run verification on initial component mount
    useEffect(() => {
        verifyUser();
    }, [verifyUser]);

    // This effect listens for changes to the auth_token in localStorage.
    // This allows the Callback page to set the token and have the AuthProvider react to it.
    useEffect(() => {
        const handleStorageChange = () => {
            const newToken = localStorage.getItem('auth_token');
            setToken(newToken);
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);


    const logout = () => {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        navigate("/login"); // Redirect to login after logout
    };

    const authContextValue = {
        isLoggedIn: !!user, // User is logged in if the user object exists
        user,
        loading,
        logout,
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};
