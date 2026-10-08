import { z } from "zod";
import type {
  FoodType,
  ItemType,
  RegistrationForm,
  RestaurantType,
} from "./registration";
const required = z.string().trim().min(1, "This field is required.");
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const isFile = (value: unknown, types: string[]): value is File =>
  typeof File !== "undefined" &&
  value instanceof File &&
  value.size > 0 &&
  value.size <= MAX_FILE_SIZE &&
  types.includes(value.type);
const isPdf = (value: unknown) => isFile(value, ["application/pdf"]);
const PDF_MESSAGE = "Upload a PDF file (up to 2 MB).";
const upload = z.custom<File>(isPdf, PDF_MESSAGE);
// Typed File | null to match the form's empty state; null is allowed.
const optionalUpload = z.custom<File | null>(
  (value) => value === null || isPdf(value),
  PDF_MESSAGE,
);
// Menu item pictures belong to the hidden menu step and stay images.
const photo = z.custom<File | null>(
  (value) => isFile(value, ["image/png", "image/jpeg"]),
  "Upload a JPG or PNG image (up to 2 MB).",
);
// Kept local (not imported) so this model stays dependency-free for tests.
const FOOD_TYPES: readonly FoodType[] = ["Veg", "Egg", "Non-veg"];
const phone = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number.");
// Typed with "" to match the unselected form state; "" still fails the check.
const oneOf = <T extends string>(allowed: readonly T[], message: string) =>
  z.custom<T | "">((v) => allowed.includes(v as T), message);
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time.");
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
    label: "One symbol (e.g. ! @ # $ %)",
    short: "Symbol",
    test: (v: string) => /[^A-Za-z0-9\s]/.test(v),
  },
];
const password = z
  .string()
  .refine(
    (value) => passwordRules.every((rule) => rule.test(value)),
    "Password does not meet all the requirements below.",
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
    email: z.string().email("Enter a valid email."),
    cuisines: z.array(required).min(1, "Choose at least one cuisine."),
    customerContact: phone,
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
    pincode: z.string().regex(/^\d{6}$/, "Enter a 6-digit pin code."),
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
      gst: z
        .string()
        .regex(
          /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
          "Enter a valid 15-character GSTIN.",
        ),
      pan: z
        .string()
        .regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Enter a valid PAN (e.g. ABCDE1234F)."),
      fssai: z
        .string()
        .regex(/^\d{14}$/, "Enter a valid 14-digit FSSAI licence number."),
      identity: required,
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
    coverPhoto: optionalUpload,
    logo: optionalUpload,
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
