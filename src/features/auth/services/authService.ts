import {
  api,
  setTokens,
  clearTokens,
  claimsOf,
  getRefreshToken,
} from "@/core/api/axios";
import { API_PATHS, endpoint, DEMO_MODE } from "@/core/constants/config";
import type {
  LoginCredentials,
  AuthSession,
  OtpChallenge,
} from "../models/auth";
type Payload = Record<string, unknown> | undefined;
const pick = (source: Payload, ...keys: string[]) =>
  keys.map((key) => source?.[key]).find((v) => typeof v === "string") as
    string | undefined;
const pickFrom = (sources: Payload[], ...keys: string[]) =>
  sources.map((source) => pick(source, ...keys)).find(Boolean);
// The success body is not documented beyond "returns access and refresh JWT
// tokens", so the common shapes ({ data: { accessToken } }, nested tokens,
// snake_case, user/restaurant objects) are all accepted.
function toSession(body: Payload): AuthSession {
  const data = (body?.data ?? body) as Payload,
    tokens = (data?.tokens ?? data) as Payload,
    accessToken = pick(tokens, "accessToken", "access_token", "token");
  if (!accessToken)
    throw new Error("Login succeeded but no token was returned.");
  const restaurant = data?.restaurant as Payload,
    // A restaurant's "name" is the restaurant, not the person signed in.
    people = [
      data?.user,
      data?.owner,
      data?.profile,
      data,
      claimsOf(accessToken),
    ] as Payload[],
    contacts = [...people.slice(0, 3), restaurant, ...people.slice(3)];
  return {
    accessToken,
    refreshToken: pick(tokens, "refreshToken", "refresh_token"),
    profile: {
      restaurantId:
        pick(restaurant, "id", "restaurant_id") ??
        pickFrom(people, "restaurant_id", "restaurantId"),
      name: pickFrom(
        people,
        "owner_name",
        "ownerName",
        "full_name",
        "fullName",
        "name",
      ),
      email: pickFrom(contacts, "email", "restaurant_email", "restaurantEmail"),
      phone: pickFrom(contacts, "mobile", "phone", "phone_number"),
      city: pickFrom(contacts, "city"),
      restaurantName: pickFrom(
        [restaurant, data],
        "restaurant_name",
        "restaurantName",
      ),
    },
  };
}
function startSession(body: Payload): AuthSession {
  const session = toSession(body);
  setTokens(session.accessToken, session.refreshToken);
  return session;
}
export async function login(
  credentials: LoginCredentials,
): Promise<AuthSession> {
  if (DEMO_MODE)
    throw new Error(
      "Demo authentication is handled in memory by the login ViewModel.",
    );
  const { data } = await api.post(endpoint(API_PATHS.login), credentials);
  return startSession(data);
}
/** `phone` is the full number with country code, e.g. +919876543210. */
export async function sendOtp(phone: string): Promise<OtpChallenge> {
  const { data } = await api.post<{ data?: OtpChallenge }>(
    endpoint(API_PATHS.sendOtp),
    { phone },
  );
  return data.data ?? {};
}
export async function verifyOtp(
  phone: string,
  otp: string,
): Promise<AuthSession> {
  const { data } = await api.post(endpoint(API_PATHS.verifyOtp), {
    phone,
    otp,
  });
  return startSession(data);
}
/**
 * POST /auth/restaurant/logout: the server revokes the access token sent with
 * the request, and the refresh token too when it is given. The tokens are
 * dropped from this browser whether or not the call works, so the vendor is
 * always signed out here.
 */
export async function logout(): Promise<void> {
  try {
    if (!DEMO_MODE && API_PATHS.logout) {
      const refreshToken = getRefreshToken();
      await api.post(
        endpoint(API_PATHS.logout),
        refreshToken ? { refreshToken } : {},
      );
    }
  } finally {
    clearTokens();
  }
}
/**
 * POST /auth/restaurant/forgot-password. For now the server returns the
 * token in the response (accessToken, access_token, resetToken, token...),
 * either at the top level or inside `data`, so the reset can continue
 * without email.
 */
export async function requestPasswordReset(
  email: string,
): Promise<{ token?: string }> {
  const { data } = await api.post(endpoint(API_PATHS.forgotPassword), {
    email,
  });
  const sources = [data, data?.data].filter(
    (value): value is Record<string, unknown> =>
      !!value && typeof value === "object",
  );
  for (const source of sources) {
    const key = Object.keys(source).find(
      (name) =>
        name.toLowerCase().includes("token") &&
        typeof source[name] === "string" &&
        source[name],
    );
    if (key) return { token: source[key] as string };
  }
  return {};
}
/** POST /auth/restaurant/reset-password with the one-time token. */
export async function resetPassword(token: string, newPassword: string) {
  await api.post(endpoint(API_PATHS.resetPassword), { token, newPassword });
}
