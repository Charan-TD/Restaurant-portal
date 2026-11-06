import { z } from "zod";
export const loginMethods = ["email", "phone"] as const;
export type LoginMethod = (typeof loginMethods)[number];
// Mirrors the backend contract for POST /auth/restaurant/login.
export const emailLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
});
export type LoginCredentials = z.infer<typeof emailLoginSchema>;
export interface LoginForm {
  method: LoginMethod;
  email: string;
  password: string;
  phone: string;
  otp: string;
}
export const initialLogin: LoginForm = {
  method: "email",
  email: "",
  password: "",
  phone: "",
  otp: "",
};
/** Who signed in, as far as the login response tells us. */
export interface SessionProfile {
  restaurantId?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  restaurantName?: string;
}
export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  profile: SessionProfile;
  /**
   * The number was verified but has no restaurant account yet, so there is no
   * login: the vendor goes on to register.
   */
  isNewUser?: boolean;
  /**
   * A saved registration the backend found for the verified number: where to
   * carry on (the steps, or the review of one already submitted) and its id.
   */
  registration?: { id: string; next: "registration" | "review" };
}
export interface OtpChallenge {
  challengeId?: string;
  /** The number has no restaurant account yet. */
  isNewUser?: boolean;
  /** Returned by non-production backends only, for testing. */
  otp?: string;
  expiresAt?: string;
}
