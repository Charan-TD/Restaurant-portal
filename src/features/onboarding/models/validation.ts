import { z } from "zod";
import { ORDER_PREP } from "@/core/constants/orderPrep";
import {
  riderOwners,
  type FoodType,
  type ItemType,
  type RegistrationForm,
  type RestaurantType,
  type RiderOwner,
} from "./registration";
const required = z.string().trim().min(1, "This field is required.");

// Tax IDs, as the backend checks them: both are upper case, and the PAN is the
// 10 characters inside the GSTIN (characters 3 to 12).
const GSTIN_FORMAT = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_FORMAT = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const STATE_CODES = new Set([
  ...Array.from({ length: 38 }, (_, i) => String(i + 1).padStart(2, "0")),
  "97",
  "99",
]);
const STATE_MESSAGE = "The state code in this GSTIN is not valid.";
/** Either number could be the wrong one, so the message names both. */
export const PAN_MISMATCH = "Check the GSTIN and PAN.";
const clean = (value: string) => value.trim().toUpperCase();

/** Why a GSTIN and PAN cannot be used together, or "" when they can. */
function gstPanProblem(gstin: string, pan: string) {
  const gst = clean(gstin),
    panValue = clean(pan);
  if (gst.length !== 15 || !GSTIN_FORMAT.test(gst))
    return "Enter a valid 15-character GSTIN.";
  if (!STATE_CODES.has(gst.slice(0, 2))) return STATE_MESSAGE;
  if (panValue.length !== 10 || !PAN_FORMAT.test(panValue))
    return "Enter a valid PAN (e.g. ABCDE1234F).";
  if (gst.slice(2, 12) !== panValue) return PAN_MISMATCH;
  return "";
}
/** True when both numbers are well formed but the GSTIN holds a different PAN. */
export const taxIdsMismatch = (gstin: string, pan: string) =>
  gstPanProblem(gstin, pan) === PAN_MISMATCH;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const isFile = (value: unknown, types: string[]): value is File =>
  typeof File !== "undefined" &&
  value instanceof File &&
  value.size > 0 &&
  value.size <= MAX_FILE_SIZE &&
  types.includes(value.type);
// Business documents and the bank proof: the backend takes a PDF or a JPEG,
// PNG or WEBP picture of the paper, up to 2 MB, judged by the file's type.
const isDocument = (value: unknown) =>
  isFile(value, ["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const DOCUMENT_MESSAGE = "Upload a PDF, JPG, PNG or WEBP file (up to 2 MB).";
const upload = z.custom<File>(isDocument, DOCUMENT_MESSAGE);
// The restaurant photo and logo: whatever the server takes, JPG, PNG or WEBP.
// Typed File | null to match the form's empty state; null is allowed.
const optionalPicture = z.custom<File | null>(
  (value) =>
    value === null || isFile(value, ["image/jpeg", "image/png", "image/webp"]),
  "Upload a JPG, PNG or WEBP image (up to 2 MB).",
);
// Menu item pictures belong to the hidden menu step and stay images.
const photo = z.custom<File | null>(
  (value) => isFile(value, ["image/png", "image/jpeg"]),
  "Upload a JPG or PNG image (up to 2 MB).",
);
/** Today as YYYY-MM-DD in the local timezone. */
export const todayIso = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};
// Kept local (not imported) so this model stays dependency-free for tests.
const FOOD_TYPES: readonly FoodType[] = ["Veg", "Egg", "Non-veg"];
const phone = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number.");
// The restaurant phone: a mobile, or a landline with its area code. The
// backend takes 10 digits, and a landline may start with the domestic 0.
// Kept local like the rest of this file, so the model stays dependency-free for
// tests (the same rule is in shared/utils/contactNumber).
const contact = z
  .string()
  .regex(
    /^0?[0-9]{10}$/,
    "Enter a 10-digit number, or a landline with its area code (a leading 0 is fine).",
  );
// Typed with "" to match the unselected form state; "" still fails the check.
const oneOf = <T extends string>(allowed: readonly T[], message: string) =>
  z.custom<T | "">((v) => allowed.includes(v as T), message);
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Select a time.");
export const passwordRules = [
  {
    label: "At least 8 characters",
    short: "8+ characters",
    test: (v: string) => v.length >= 8,
  },
  {
    label: "One uppercase letter (A–Z)",
    short: "Uppercase",
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    label: "One lowercase letter (a–z)",
    short: "Lowercase",
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    label: "One number (0–9)",
    short: "Number",
    test: (v: string) => /\d/.test(v),
  },
  {
    label: "One symbol (e.g. ! @ # $ %)",
    short: "Symbol",
    test: (v: string) => /[^A-Za-z0-9\s]/.test(v),
  },
];
const password = z
  .string()
  .refine(
    (value) => passwordRules.every((rule) => rule.test(value)),
    "Use 8+ characters with an uppercase, a lowercase, a number and a symbol.",
  );
export const menuItemSchema = z.object({
  type: oneOf<ItemType>(
    ["Veg", "Egg", "Non-veg"],
    "Select veg, egg or non-veg.",
  ),
  name: required,
  price: z.number().positive("Enter a positive price."),
  description: required,
  image: photo,
});
export const registrationSchema: z.ZodType<RegistrationForm> = z
  .object({
    restaurantName: required,
    ownerName: required,
    mobile: phone,
    restaurantType: oneOf<RestaurantType>(
      ["Restaurant", "Cloud kitchen"],
      "Select restaurant or cloud kitchen.",
    ),
    foodServed: z
      .array(z.custom<FoodType>((v) => FOOD_TYPES.includes(v as FoodType)))
      .min(1, "Select at least one type of food you serve."),
    riderOwner: oneOf<RiderOwner>(
      riderOwners,
      "Choose who delivers your orders to the train.",
    ),
    email: z.string().email("Enter a valid email."),
    cuisines: z
      .array(required)
      .min(1, "Choose at least one cuisine.")
      .max(3, "Pick up to 3 cuisines."),
    customerContact: contact,
    password,
    confirmPassword: z.string().min(1, "Confirm your password."),
    address: z
      .string()
      .trim()
      .min(1, "Search and select your restaurant location."),
    building: required,
    landmark: required,
    city: required,
    state: required,
    // The backend takes a 6-digit pin code that does not start with 0.
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pin code."),
    // The exact pin is sent to the backend, so a location must be placed.
    latitude: z
      .number()
      .nullable()
      .refine((v) => v !== null, "Search for your location to place the pin."),
    longitude: z.number().nullable(),
    accountHolder: required,
    accountNumber: z
      .string()
      .regex(/^\d{9,18}$/, "Enter a valid account number (9–18 digits)."),
    confirmAccountNumber: required,
    ifsc: z
      .string()
      .regex(/^[A-Z0-9]{11}$/, "IFSC must be exactly 11 letters or digits."),
    bankName: required,
    documentNumbers: z.object({
      // The backend asks for the GSTIN and its certificate like the rest.
      // Typed in any case; checked in upper case.
      gst: z
        .string()
        .transform(clean)
        .pipe(z.string().regex(GSTIN_FORMAT, "Enter a valid 15-character GSTIN.")),
      pan: z
        .string()
        .transform(clean)
        .pipe(z.string().regex(PAN_FORMAT, "Enter a valid PAN (e.g. ABCDE1234F).")),
      fssai: z
        .string()
        .regex(/^\d{14}$/, "Enter a valid 14-digit FSSAI licence number."),
      fssaiExpiry: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the FSSAI licence expiry date.")
        .refine(
          (date) => date >= todayIso(),
          "The FSSAI licence has expired. Enter a date that is not in the past.",
        ),
      identity: z
        .string()
        .regex(/^\d{12}$/, "Enter a valid 12-digit Aadhaar number."),
      businessProof: required,
    }),
    documents: z.object({
      gst: upload,
      pan: upload,
      fssai: upload,
      identity: upload,
      businessProof: upload,
    }),
    bankProof: upload,
    coverPhoto: optionalPicture,
    logo: optionalPicture,
    hours: z
      .array(
        z.object({
          day: required,
          open: z.boolean(),
          shifts: z.array(z.object({ start: time, end: time })),
        }),
      )
      .superRefine((days, ctx) => {
        if (!days.some((day) => day.open))
          ctx.addIssue({
            code: "custom",
            message: "Set at least one open day.",
          });
        days.forEach((day, i) => {
          if (!day.open) return;
          if (!day.shifts.length)
            ctx.addIssue({
              code: "custom",
              path: [i, "shifts"],
              message: "Add an operating shift.",
            });
          day.shifts.forEach((shift, j) => {
            if (shift.end <= shift.start)
              ctx.addIssue({
                code: "custom",
                path: [i, "shifts", j, "end"],
                message: "Closing time must be after opening time.",
              });
            if (
              day.shifts.some(
                (other, k) =>
                  k !== j && shift.start < other.end && shift.end > other.start,
              )
            )
              ctx.addIssue({
                code: "custom",
                path: [i, "shifts", j, "start"],
                message: "Shifts must not overlap.",
              });
          });
        });
      }),
    orderPrepMinutes: z
      .number()
      .int("Enter whole minutes.")
      .min(ORDER_PREP.min, `Prep time is at least ${ORDER_PREP.min} minutes.`)
      .max(ORDER_PREP.max, `Prep time is at most ${ORDER_PREP.max} minutes.`)
      .refine(
        (value) => value % ORDER_PREP.step === 0,
        `Use steps of ${ORDER_PREP.step} minutes.`,
      ),
    // The menu step is hidden for now; add `.min(1, "Add at least one menu
    // item.")` back when it is re-enabled.
    menuItems: z.array(menuItemSchema),
    agreement: z
      .boolean()
      .refine((value) => value, "Accept the agreement to submit."),
  })
  .superRefine((data, ctx) => {
    if (
      data.menuItems.some(
        (item) => item.type && !data.foodServed.includes(item.type),
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["menuItems"],
        message: "Menu items must match the food types you serve.",
      });
    // The format errors above already name a bad GSTIN or PAN; these two are
    // the checks that need both numbers together.
    const taxIdProblem = gstPanProblem(
      data.documentNumbers.gst,
      data.documentNumbers.pan,
    );
    if (taxIdProblem === STATE_MESSAGE)
      ctx.addIssue({
        code: "custom",
        path: ["documentNumbers", "gst"],
        message: STATE_MESSAGE,
      });
    // A GSTIN/PAN mismatch is not a field error (either number could be the
    // wrong one): the form checks it with taxIdsMismatch and shows PAN_MISMATCH
    // as the page message.
    if (data.password !== data.confirmPassword)
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords must match.",
      });
    if (data.accountNumber !== data.confirmAccountNumber)
      ctx.addIssue({
        code: "custom",
        path: ["confirmAccountNumber"],
        message: "Account numbers must match.",
      });
  });
