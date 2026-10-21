import axios from "axios";
// The backend uses bearer tokens, not cookies, and allows any origin (*).
// Browsers block credentialed requests to a "*" origin, so none are sent.
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || undefined,
  timeout: 15000,
});
const TOKEN_KEY = "td.accessToken",
  REFRESH_KEY = "td.refreshToken";
// Storage can be unavailable (private mode, blocked site data), so every
// access is guarded and a missing token simply means "not signed in".
export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}
export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}
/** Reads the JWT's claims, which often carry the user's name and email. */
export function claimsOf(
  token: string,
): Record<string, unknown> | undefined {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(part), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return undefined;
  }
}
export function setTokens(accessToken: string, refreshToken?: string) {
  try {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  } catch {}
}
export function clearTokens() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {}
}
api.interceptors.request.use((config) => {
  const token = typeof window === "undefined" ? null : getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
