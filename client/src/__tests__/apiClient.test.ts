import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  apiClient,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
  ApiError,
} from "../lib/api-client";

const createMemoryStorage = () => {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
};

describe("Frontend apiClient & Token Refresh Rotation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(),
      writable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: { dispatchEvent: vi.fn() },
      writable: true,
    });
  });

  it("stores, reads, and clears access and refresh tokens", () => {
    setAuthToken("access-123", "refresh-456");
    expect(getAuthToken()).toBe("access-123");
    expect(localStorage.getItem("truehire_refresh_token")).toBe("refresh-456");

    clearAuthToken();
    expect(getAuthToken()).toBeNull();
    expect(localStorage.getItem("truehire_refresh_token")).toBeNull();
  });

  it("attaches Authorization Bearer header when token is set", async () => {
    setAuthToken("jwt-token-abc");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiClient.get<{ success: boolean }>("/readiness");
    expect(res.success).toBe(true);

    const calledHeaders = fetchMock.mock.calls[0][1].headers as Headers;
    expect(calledHeaders.get("Authorization")).toBe("Bearer jwt-token-abc");
  });

  it("automatically rotates token on 401 and retries original request", async () => {
    setAuthToken("expired-access", "valid-refresh");

    const fetchMock = vi
      .fn()
      // 1st call: original endpoint returns 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Token expired" }),
      })
      // 2nd call: /auth/refresh returns new tokens
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          token: "rotated-access-token",
          refreshToken: "rotated-refresh-token",
        }),
      })
      // 3rd call: retried endpoint succeeds
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ jobs: [{ id: "job-1" }] }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const data = await apiClient.get<{ jobs: { id: string }[] }>("/jobs");
    expect(data.jobs).toHaveLength(1);
    expect(getAuthToken()).toBe("rotated-access-token");
    expect(localStorage.getItem("truehire_refresh_token")).toBe(
      "rotated-refresh-token",
    );
  });

  it("throws structured ApiError on non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          message: "Unparseable resume",
          code: "RESUME_UNPARSEABLE",
        }),
      }),
    );

    await expect(apiClient.post("/resumes", {})).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
