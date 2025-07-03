import React, { createContext, useContext, useState, ReactNode } from "react";
import * as authService from "../utils/authService";

interface AuthContextType {
  token: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<authService.AuthResponse>;
  register: (username: string, password: string) => Promise<authService.AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(authService.getToken());

  const login = async (username: string, password: string) => {
    const result = await authService.login(username, password);
    if (result.token) {
      authService.saveToken(result.token);
      setToken(result.token);
    }
    return result;
  };

  const register = async (username: string, password: string) => {
    const result = await authService.register(username, password);
    if (result.token) {
      authService.saveToken(result.token);
      setToken(result.token);
    }
    return result;
  };

  const logout = async () => {
    if (token) {
      await authService.logout(token);
    }
    authService.removeToken();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isLoggedIn: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
