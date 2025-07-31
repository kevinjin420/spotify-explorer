import axios from "axios";

const API_BASE = "http://localhost:8000/api";

export const api = axios.create({
	baseURL: API_BASE,
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response.status === 403 && !originalRequest._retry) {
			originalRequest._retry = true;
			const newAccessToken = await refreshToken();
			if (newAccessToken) {
				originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
				console.log("token refresh success");
				return api(originalRequest);
			}
		}
		return Promise.reject(error);
	}
);

export async function refreshToken(): Promise<string | null> {
	const refreshToken = getRefreshToken();
	if (!refreshToken) {
		return null;
	}

	try {
		const { data } = await axios.post(`${API_BASE}/token/refresh/`, {
			refresh: refreshToken,
		});
		saveTokens(data.access, data.refresh);
		return data.access;
	} catch (error) {
		console.error("Failed to refresh token", error);
		removeTokens();
		return null;
	}
}

export function getAccessToken(): string | null {
	return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
	return localStorage.getItem("refresh_token");
}

export function saveTokens(accessToken: string, refreshToken: string): void {
	localStorage.setItem("access_token", accessToken);
	localStorage.setItem("refresh_token", refreshToken);
	api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
}

export function removeTokens(): void {
	localStorage.removeItem("access_token");
	localStorage.removeItem("refresh_token");
	delete api.defaults.headers.common["Authorization"];
}

const accessToken = getAccessToken();
if (accessToken) {
	api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
}
