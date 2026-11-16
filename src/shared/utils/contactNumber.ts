/**
 * The backend takes a restaurant phone as a 10-digit mobile, or a landline with
 * 10 national digits; a landline may carry the domestic leading 0 (11 digits).
 */
export const CONTACT_MAX = 11;
export const CONTACT_PATTERN = /^0?[0-9]{10}$/;
export const CONTACT_MESSAGE =
  "Enter a 10-digit number, or a landline with its area code (a leading 0 is fine).";
/** Keeps only the digits (a leading 0 stays), up to the longest number allowed. */
export const contactDigits = (value: string | undefined) =>
  (value ?? "").replace(/\D/g, "").slice(0, CONTACT_MAX);
