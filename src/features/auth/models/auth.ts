import { z } from "zod";
export const loginMethods = ["email", "phone"] as const;
export type LoginMethod = (typeof loginMethods)[number];
// Not enforced yet: login currently skips validation and opens the dashboard.
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginCredentials = z.infer<typeof loginSchema>;
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
export interface AuthSession {
  authenticated: boolean;
  restaurantName?: string;
  approvalStatus: "Under review" | "Approved" | "Rejected";
}
