const API_BASE = "http://localhost:8000/api";

export interface AuthResponse {
  token?: string;
  error?: string;
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return await res.json();
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return await res.json();
}

export async function logout(token: string): Promise<void> {
  await fetch(`${API_BASE}/logout/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${token}`,
    },
  });
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function saveToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}
