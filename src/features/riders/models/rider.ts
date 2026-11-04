export interface Rider {
  id: string;
  name: string;
  /** Ten digits, without the country code. */
  phone: string;
  /** A (signed) link to the profile picture, when the rider has one. */
  photoUrl?: string;
  addedAt?: string;
}
/** What the add rider form collects. */
export interface RiderForm {
  name: string;
  phone: string;
  photo?: File;
}
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
