import { z } from "zod";
export const PROFILE_HREF = "/profile";
/** The email is not part of the form: it is shown, but never edited. */
export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  restaurantName: z.string().trim().min(2, "Enter the restaurant name."),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Enter a 10-digit mobile number.")
    .or(z.literal("")),
  city: z.string().trim(),
});
export type ProfileForm = z.infer<typeof profileSchema>;
/**
 * Outside demo mode only the phone is edited directly; the other fields are
 * shown locked (they change through approval), so they are not checked.
 */
export const lockedProfileSchema = profileSchema.extend({
  name: z.string(),
  restaurantName: z.string(),
  city: z.string(),
});
