export interface Rider {
  id: string;
  name: string;
  /** Ten digits, without the country code. */
  phone: string;
  /** A (signed) link to the profile picture, when the rider has one. */
  photoUrl?: string;
  addedAt?: string;
  /** From the server when it reports it; otherwise the restaurant's own switch. */
  onDuty?: boolean;
  /** True while the rider is out on a delivery. */
  onDelivery?: boolean;
  deliveriesToday?: number;
}
export type RiderStatus = "available" | "delivering" | "off";
export const riderStatus = (r: Rider, onDuty: boolean): RiderStatus =>
  !onDuty ? "off" : r.onDelivery ? "delivering" : "available";
/** What the add rider form collects. Only the name and phone are required by the API. */
export interface RiderForm {
  name: string;
  phone: string;
  photo?: File;
  email?: string;
  /** YYYY-MM-DD */
  dob?: string;
  gender?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  licenseNumber?: string;
  rcNumber?: string;
  aadhaarFile?: File;
  panFile?: File;
  licenseFile?: File;
  rcFile?: File;
}
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export const VEHICLE_TYPES = ["BIKE", "SCOOTER"] as const;
/** Documents: JPG, PNG or PDF, up to 5 MB each. */
export const DOC_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const DOC_MAX_BYTES = 5 * 1024 * 1024;
/** The first problem with a picked document, or "". */
export function docProblem(file: File): string {
  if (!DOC_TYPES.includes(file.type)) return "Choose a JPG, PNG or PDF.";
  if (file.size > DOC_MAX_BYTES) return "The file must be 5 MB or smaller.";
  return "";
}
const filled = (v?: string) => !!v?.trim();
/** What is wrong with the extended fields, by field; empty when all is well. */
export function riderProblems(f: RiderForm): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.name.trim().length < 2) p.name = "Enter the rider's full name.";
  if (!/^[6-9]\d{9}$/.test(f.phone)) p.phone = "Enter a valid 10 digit mobile number.";
  if (filled(f.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email!.trim()))
    p.email = "Enter a valid email.";
  if (filled(f.aadhaarNumber) && !/^\d{12}$/.test(f.aadhaarNumber!))
    p.aadhaarNumber = "Aadhaar is 12 digits.";
  if (filled(f.panNumber) && !/^[A-Z]{5}\d{4}[A-Z]$/.test(f.panNumber!))
    p.panNumber = "PAN looks like ABCDE1234F.";
  return p;
}
