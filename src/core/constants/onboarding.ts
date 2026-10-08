import type { FieldPath } from "react-hook-form";
import {
  COUNTRY_CODE,
  foodTypes,
  restaurantTypes,
  type RegistrationForm,
} from "@/features/onboarding/models/registration";
export type StepId =
  "details" | "location" | "documents" | "bank" | "menu" | "hours" | "review";
export interface StepDefinition {
  id: StepId;
  title: string;
  description: string;
  /** Disabled steps stay defined so they can be switched back on later. */
  enabled: boolean;
}
const allSteps: StepDefinition[] = [
  {
    id: "details",
    title: "Restaurant details",
    description:
      "Tell us about your restaurant, set up your login and add your restaurant's photos.",
    enabled: true,
  },
  {
    id: "location",
    title: "Restaurant location",
    description:
      "Search for your restaurant, then add the building and a landmark.",
    enabled: true,
  },
  {
    id: "documents",
    title: "Business documents",
    description:
      "Enter your business document numbers and upload a PDF copy of each.",
    enabled: true,
  },
  {
    id: "bank",
    title: "Bank account",
    description: "Add the bank account for your payouts.",
    enabled: true,
  },
  {
    id: "menu",
    title: "Menu",
    description:
      "Add your menu items with a description, picture and veg / non-veg type.",
    // Hidden for now. To bring it back, set this to true and restore
    // `.min(1)` on menuItems in the registration schema.
    enabled: false,
  },
  {
    id: "hours",
    title: "Operating hours",
    description: "Choose the days and times you accept orders.",
    enabled: true,
  },
  {
    id: "review",
    title: "Review & submit",
    description: "Check your information before sending it for approval.",
    enabled: true,
  },
];
export const steps = allSteps.filter((step) => step.enabled);
export const LAST_STEP = steps.length - 1;
export const stepIndex = (id: StepId) =>
  steps.findIndex((step) => step.id === id);
const digits = (value: string) => value.replace(/\D/g, "");
const alphanumericUpper = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "");
export interface FieldDefinition {
  name: FieldPath<RegistrationForm>;
  label: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "password"
    | "select"
    | "radio"
    | "checkboxes"
    | "cuisines";
  options?: readonly string[];
  /** Text shown before the input, e.g. the country code. */
  prefix?: string;
  /** Cleans every keystroke, e.g. strips non-digits. */
  sanitize?: (value: string) => string;
  maxLength?: number;
  inputMode?: "numeric" | "text";
  /** Shows a live "must match" check against another field. */
  matches?: FieldPath<RegistrationForm>;
  multiline?: boolean;
  fullWidth?: boolean;
}
const phoneField = {
  type: "tel",
  prefix: COUNTRY_CODE,
  sanitize: digits,
  maxLength: 10,
  inputMode: "numeric",
} as const;
export const fieldGroups: Partial<Record<StepId, FieldDefinition[]>> = {
  details: [
    { name: "restaurantName", label: "Restaurant name", fullWidth: true },
    { name: "ownerName", label: "Owner name" },
    { name: "mobile", label: "Mobile", ...phoneField },
    { name: "email", label: "Email", type: "email", fullWidth: true },
    { name: "cuisines", label: "Cuisines", type: "cuisines" },
    {
      name: "customerContact",
      label: "Restaurant contact (for customers & riders)",
      ...phoneField,
    },
    { name: "password", label: "Password", type: "password" },
    {
      name: "confirmPassword",
      label: "Confirm password",
      type: "password",
      matches: "password",
    },
    {
      name: "restaurantType",
      label: "Restaurant type",
      type: "radio",
      options: restaurantTypes,
    },
    {
      name: "foodServed",
      label: "Food served",
      type: "checkboxes",
      options: foodTypes,
    },
  ],
  location: [
    { name: "building", label: "Shop no. / Building / Floor" },
    { name: "landmark", label: "Landmark" },
    { name: "city", label: "City" },
    { name: "state", label: "State" },
    {
      name: "pincode",
      label: "Pin code",
      sanitize: digits,
      maxLength: 6,
      inputMode: "numeric",
    },
  ],
  bank: [
    { name: "accountHolder", label: "Account holder name", fullWidth: true },
    {
      name: "accountNumber",
      label: "Account number",
      sanitize: digits,
      maxLength: 18,
      inputMode: "numeric",
    },
    {
      name: "confirmAccountNumber",
      label: "Confirm account number",
      sanitize: digits,
      maxLength: 18,
      inputMode: "numeric",
      matches: "accountNumber",
    },
    {
      name: "ifsc",
      label: "IFSC",
      sanitize: alphanumericUpper,
      maxLength: 11,
    },
    { name: "bankName", label: "Bank name" },
  ],
};
export const restaurantPhotoFields = [
  {
    name: "coverPhoto",
    label: "Restaurant picture",
    optional: true,
    accept: "image",
  },
  { name: "logo", label: "Restaurant logo", optional: true, accept: "image" },
] as const;
/** Step 1 is long, so its fields are shown in titled groups, in this order. */
export const detailSections: {
  title: string;
  description: string;
  fields: FieldPath<RegistrationForm>[];
  photos?: boolean;
}[] = [
  {
    title: "Restaurant information",
    description: "Enter your restaurant name as it will appear to customers.",
    fields: [
      "restaurantName",
      "customerContact",
      "cuisines",
      "restaurantType",
      "foodServed",
    ],
  },
  {
    title: "Owner & login",
    description: "You will use this email and password to log in.",
    fields: ["ownerName", "mobile", "email", "password", "confirmPassword"],
  },
  {
    title: "Photos",
    description:
      "Add your restaurant photo and logo to help customers recognize your brand.",
    fields: [],
    photos: true,
  },
];
export const documentFields: {
  label: string;
  file: FieldPath<RegistrationForm>;
  number: FieldDefinition;
}[] = [
  {
    label: "GST certificate",
    file: "documents.gst",
    number: {
      name: "documentNumbers.gst",
      label: "GSTIN",
      sanitize: alphanumericUpper,
      maxLength: 15,
    },
  },
  {
    label: "PAN card",
    file: "documents.pan",
    number: {
      name: "documentNumbers.pan",
      label: "PAN number",
      sanitize: alphanumericUpper,
      maxLength: 10,
    },
  },
  {
    label: "FSSAI licence",
    file: "documents.fssai",
    number: {
      name: "documentNumbers.fssai",
      label: "FSSAI licence number",
      sanitize: digits,
      maxLength: 14,
      inputMode: "numeric",
    },
  },
  {
    label: "Identity proof",
    file: "documents.identity",
    number: {
      name: "documentNumbers.identity",
      label: "ID number (Aadhaar / Passport / Voter ID)",
      sanitize: alphanumericUpper,
      maxLength: 20,
    },
  },
  {
    label: "Business proof",
    file: "documents.businessProof",
    number: {
      name: "documentNumbers.businessProof",
      label: "Registration / licence number",
      sanitize: (value) => value.toUpperCase(),
      maxLength: 30,
    },
  },
];
const names = (id: StepId) => (fieldGroups[id] ?? []).map((f) => f.name);
export const stepFields: Record<StepId, FieldPath<RegistrationForm>[]> = {
  details: [...names("details"), ...restaurantPhotoFields.map((f) => f.name)],
  location: ["address", "latitude", "longitude", ...names("location")],
  documents: documentFields.flatMap((f) => [f.number.name, f.file]),
  bank: [...names("bank"), "bankProof"],
  menu: ["menuItems"],
  hours: ["hours"],
  review: ["agreement"],
};
