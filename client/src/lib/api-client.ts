const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "http://localhost:5000/api";

const AUTH_TOKEN_KEY = "truehire_auth_token";
const REFRESH_TOKEN_KEY = "truehire_refresh_token";

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface ErrorBody {
  message?: string;
  error?: string;
  code?: string;
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as {
          token?: string;
          refreshToken?: string;
        };
        if (data.token) {
          localStorage.setItem(AUTH_TOKEN_KEY, data.token);
          if (data.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
          }
          return data.token;
        }
        return null;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const buildHeaders = (overrideToken?: string | null) => {
    const headers = new Headers(options.headers);
    const isFormData = options.body instanceof FormData;
    if (
      !isFormData &&
      options.body !== undefined &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }
    const token =
      overrideToken !== undefined
        ? overrideToken
        : localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return { headers, token };
  };

  const { headers, token } = buildHeaders();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Check your connection and try again.",
      0,
      "NETWORK_ERROR",
    );
  }

  const isAuthEndpoint =
    endpoint === "/auth/login" ||
    endpoint === "/auth/register" ||
    endpoint === "/auth/refresh";

  if (response.status === 401 && token && !isAuthEndpoint) {
    const newAccessToken = await tryRefreshAccessToken();
    if (newAccessToken) {
      const retryHeaders = buildHeaders(newAccessToken).headers;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
      });
    } else {
      clearAuthToken();
      window.dispatchEvent(new Event("truehire:unauthorized"));
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null;
    throw new ApiError(
      body?.message ||
        body?.error ||
        `Request failed (HTTP ${response.status})`,
      response.status,
      body?.code,
    );
  }

  const payload = (await response.json()) as T;

  // Automatically store refreshToken if returned by login/register
  if (
    isAuthEndpoint &&
    payload &&
    typeof payload === "object" &&
    "refreshToken" in payload &&
    typeof (payload as Record<string, unknown>).refreshToken === "string"
  ) {
    localStorage.setItem(
      REFRESH_TOKEN_KEY,
      (payload as Record<string, string>).refreshToken,
    );
  }

  return payload;
}

apiClient.get = <T>(endpoint: string, options?: RequestInit) =>
  apiClient<T>(endpoint, { ...options, method: "GET" });

apiClient.post = <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
  apiClient<T>(endpoint, {
    ...options,
    method: "POST",
    body:
      body instanceof FormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
  });

apiClient.patch = <T>(
  endpoint: string,
  body?: unknown,
  options?: RequestInit,
) =>
  apiClient<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

apiClient.delete = <T>(endpoint: string, options?: RequestInit) =>
  apiClient<T>(endpoint, { ...options, method: "DELETE" });

export function setAuthToken(token: string, refreshToken?: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
