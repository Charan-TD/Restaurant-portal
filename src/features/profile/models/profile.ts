import { z } from "zod";
export const PROFILE_HREF = "/profile";
export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  restaurantName: z.string().trim().min(2, "Enter the restaurant name."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Enter a 10-digit mobile number.")
    .or(z.literal("")),
  city: z.string().trim(),
});
export type ProfileForm = z.infer<typeof profileSchema>;
