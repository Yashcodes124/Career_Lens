export const API_URL =
  process.env.PLAYWRIGHT_API_URL || "http://localhost:5000/api";

export async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: string;
    token?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  if (options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: options.method ?? "GET",
    headers,
    body:
      options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as T;
  return { status: res.status, data };
}