"use client";
import { useWatch } from "react-hook-form";
import { usePortal } from "@/core/providers/PortalProvider";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
const FALLBACK_NAME = "Restaurant Partner";
/** One letter for the avatar: the first letter of the name, "Ravi Kumar" → "R". */
export function initialsOf(name: string) {
  return name.trim().charAt(0).toUpperCase() || "R";
}
/** "ravi.kumar@x.com" → "Ravi Kumar", for when no name is known. */
function nameFromEmail(email: string | undefined) {
  return (email?.split("@")[0] ?? "")
    .replace(/[._\-\d]+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
/** "+919876543210" or "9876543210" → "9876543210". */
export function localDigits(phone: string | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}
/**
 * The signed-in vendor as shown across the portal. The login profile wins;
 * the registration form fills in anything it does not carry.
 */
export function useVendorProfile() {
  const portal = usePortal(),
    { profile, approval, online, setOnline } = portal;
  const [ownerName, restaurantName, email, mobile, city] = useWatch({
    control: portal.form.control,
    name: ["ownerName", "restaurantName", "email", "mobile", "city"],
  });
  const vendorName =
      profile.name?.trim() ||
      ownerName?.trim() ||
      nameFromEmail(profile.email || email) ||
      FALLBACK_NAME,
    phone = localDigits(profile.phone || mobile);
  return {
    vendorName,
    /** False while the name is only the generic fallback. */
    nameKnown: vendorName !== FALLBACK_NAME,
    initials: initialsOf(vendorName),
    /** Empty when no source has the restaurant's name yet. */
    restaurantName:
      profile.restaurantName?.trim() ||
      restaurantName?.trim() ||
      approval?.restaurantName?.trim() ||
      "",
    email: profile.email?.trim() || email?.trim() || "",
    phone,
    mobile: phone ? `${COUNTRY_CODE} ${phone}` : "",
    city: profile.city?.trim() || city?.trim() || "",
    online,
    setOnline,
  };
}
export type VendorProfile = ReturnType<typeof useVendorProfile>;
