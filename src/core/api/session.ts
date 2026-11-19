// The backend uses bearer tokens, not cookies, and allows any origin (*).
// Browsers block credentialed requests to a "*" origin, so none are sent.
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
export function claimsOf(token: string): Record<string, unknown> | undefined {
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
const REGISTRATION_TOKEN_KEY = "td.registrationToken";
/** The short-lived token the server gives a verified number to fill in its registration. */
export function getRegistrationToken(): string | null {
  try {
    return localStorage.getItem(REGISTRATION_TOKEN_KEY);
  } catch {
    return null;
  }
}
/**
 * A local key for the registration the token is bound to. The server no longer
 * puts a registration id in URLs or responses, and the token's claims are not
 * documented, so the id is read from them when present and otherwise falls
 * back to the verified phone (a number has one registration at a time). It is
 * only a marker for this browser: the server finds the draft from the token.
 */
export function registrationIdOf(
  token?: string | null,
  fallback?: string,
): string | undefined {
  if (!token) return undefined;
  const claims = claimsOf(token);
  for (const key of ["registration_id", "registrationId"]) {
    const id = claims?.[key];
    if (typeof id === "string" && id) return id;
  }
  return fallback || undefined;
}
export function setRegistrationToken(token?: string | null) {
  try {
    if (token) localStorage.setItem(REGISTRATION_TOKEN_KEY, token);
    else localStorage.removeItem(REGISTRATION_TOKEN_KEY);
  } catch {}
}
export function clearTokens() {
  try {
    localStorage.removeItem(REGISTRATION_TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    // The saved riders choice (useRidersOwner) belongs to this account.
    localStorage.removeItem("td.ridersOwner");
  } catch {}
}
