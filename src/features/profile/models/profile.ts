import { z } from "zod";
import { CONTACT_MESSAGE, CONTACT_PATTERN } from "@/shared/utils/contactNumber";
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
  // The restaurant phone: 10 digits, or a landline with its leading 0 (11).
  phone: z.string().regex(CONTACT_PATTERN, CONTACT_MESSAGE).or(z.literal("")),
  name: z.string(),
  restaurantName: z.string(),
  city: z.string(),
});
