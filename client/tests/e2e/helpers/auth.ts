import type { Page } from "@playwright/test";
import { apiRequest } from "./api.js";

export async function loginViaApi(email: string, password: string) {
  const res = await apiRequest<{
    token: string;
    refreshToken: string;
    user: { id: string; email: string; name: string; role: string };
  }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (res.status !== 200 || !res.data.token) {
    throw new Error(`Failed to login ${email}: HTTP ${res.status}`);
  }
  return res.data;
}

export async function authenticatePage(
  page: Page,
  tokens: { token: string; refreshToken?: string },
) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ accessToken, refresh }) => {
      localStorage.setItem("truehire_auth_token", accessToken);
      if (refresh) {
        localStorage.setItem("truehire_refresh_token", refresh);
      }
    },
    { accessToken: tokens.token, refresh: tokens.refreshToken },
  );
}