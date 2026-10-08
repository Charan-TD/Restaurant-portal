import { api } from "@/core/api/axios";
import { API_PATHS, endpoint, DEMO_MODE } from "@/core/constants/config";
import type { LoginCredentials, AuthSession } from "../models/auth";
export async function login(
  credentials: LoginCredentials,
): Promise<AuthSession> {
  if (DEMO_MODE)
    throw new Error(
      "Demo authentication is handled in memory by the login ViewModel.",
    );
  const { data } = await api.post<AuthSession>(
    endpoint(API_PATHS.login),
    credentials,
  );
  return data;
}
export async function logout(): Promise<void> {
  if (!DEMO_MODE) await api.post(endpoint(API_PATHS.logout));
}
