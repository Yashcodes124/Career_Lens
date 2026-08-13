const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:5000/api";

const AUTH_TOKEN_KEY = "truehire_auth_token";

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.entries(existingHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}
