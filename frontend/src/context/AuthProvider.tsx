import { useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import * as authService from "../utils/authService";

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
