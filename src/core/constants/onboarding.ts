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
  /** The short line under the title in the setup list. */
  hint: string;
  /** Disabled steps stay defined so they can be switched back on later. */
  enabled: boolean;
}
const allSteps: StepDefinition[] = [
  {
    id: "details",
    title: "Restaurant details",
    description: "Your restaurant info and how food reaches the train",
    hint: "Name, owner, cuisines, delivery",
    enabled: true,
  },
  {
    id: "location",
    title: "Location",
    description: "Where riders pick up your orders",
    hint: "Address and stations you serve",
    enabled: true,
  },
  {
    id: "documents",
    title: "Documents",
    description: "We check these before your restaurant goes live",
    hint: "FSSAI, PAN, GST",
    enabled: true,
  },
  {
    id: "bank",
    title: "Bank account",
    description: "Where we send your weekly payouts",
    hint: "Where we send weekly payouts",
    enabled: true,
  },
  {
    id: "menu",
    title: "Menu",
    description:
      "Add your menu items with a description, picture and veg / non-veg type.",
    hint: "Dishes, prices and pictures",
    // Hidden for now. To bring it back, set this to true and restore
    // `.min(1)` on menuItems in the registration schema.
    enabled: false,
  },
  {
    id: "hours",
    title: "Operating hours",
    description: "Passengers can order only while you are open",
    hint: "Days and times you take orders",
    enabled: true,
  },
  {
    id: "review",
    title: "Review & submit",
    description: "Check your information before sending it for approval.",
    hint: "Check and send for approval",
    // The design submits from the last step, Operating hours.
    enabled: false,
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
    | "date"
    | "select"
    | "radio"
    | "checkboxes"
    | "cuisines"
    | "riders";
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
  placeholder?: string;
  /** Shown under the field while it has no error. */
  hint?: string;
  /** A small icon at the start of the input. */
  icon?:
    | "restaurant"
    | "owner"
    | "email"
    | "dining"
    | "phone"
    | "hash"
    | "calendar"
    | "bank"
    | "lock";
  /** Left out of the required mark. */
  optional?: boolean;
  /** A muted line after the label, like "for customers & riders". */
  labelNote?: string;
  /** Shown in green under a confirm field once both match. */
  matchText?: string;
}
const phoneField = {
  type: "tel",
  prefix: COUNTRY_CODE,
  sanitize: digits,
  maxLength: 10,
  inputMode: "numeric",
} as const;
export const fieldGroups: Partial<Record<StepId, FieldDefinition[]>> = {
  // Sign-in is by OTP, so the form asks for no password.
  details: [
    {
      name: "restaurantName",
      label: "Restaurant name",
      placeholder: "e.g. Kitchen Bowl",
      icon: "restaurant",
      fullWidth: true,
    },
    {
      name: "ownerName",
      label: "Owner name",
      placeholder: "Full name",
      icon: "owner",
      fullWidth: true,
    },
    {
      name: "mobile",
      label: "Mobile",
      placeholder: "10-digit mobile number",
      hint: "Verified with OTP",
      ...phoneField,
    },
    {
      name: "email",
      label: "Email",
      type: "email",
      icon: "email",
      placeholder: "name@restaurant.com",
    },
    {
      name: "password",
      label: "Create password",
      type: "password",
      icon: "lock",
      placeholder: "Create a password",
    },
    {
      name: "confirmPassword",
      label: "Confirm password",
      type: "password",
      icon: "lock",
      placeholder: "Re-enter the password",
      matches: "password",
      matchText: "Passwords match",
    },
    {
      name: "restaurantType",
      label: "Restaurant type",
      icon: "dining",
      placeholder: "Select restaurant type",
      hint: "Dhaba, family restaurant, cloud kitchen, sweet shop...",
      type: "select",
      options: restaurantTypes,
    },
    { name: "cuisines", label: "Cuisines", type: "cuisines" },
    {
      name: "customerContact",
      label: "Restaurant phone",
      labelNote: "for customers & riders",
      fullWidth: true,
      icon: "phone",
      placeholder: "Landline or mobile",
      hint: "Mobile, or landline with area code (10 digits). Riders and passengers call this number about an order",
      ...phoneField,
      prefix: undefined,
      // A landline is often written with a leading 0 (0866 …): drop it.
      sanitize: (value: string) => digits(value).replace(/^0+/, ""),
    },
    {
      name: "foodServed",
      label: "Food served",
      type: "checkboxes",
      options: foodTypes,
    },
    {
      name: "riderOwner",
      label: "Delivery to the train",
      type: "riders",
      fullWidth: true,
    },
  ],
  location: [
    {
      name: "building",
      label: "Shop number and building",
      placeholder: "e.g. 12, Ground floor, Sri Sai Complex",
      fullWidth: true,
    },
    { name: "landmark", label: "Landmark", placeholder: "e.g. Near Sony World signal" },
    { name: "city", label: "City", placeholder: "City" },
    { name: "state", label: "State", placeholder: "State" },
    {
      name: "pincode",
      label: "PIN code",
      placeholder: "6-digit PIN code",
      sanitize: digits,
      maxLength: 6,
      inputMode: "numeric",
    },
  ],
  bank: [
    {
      name: "accountHolder",
      label: "Account holder name",
      placeholder: "e.g. KITCHEN BOWL",
      hint: "As printed on your passbook or cheque",
      fullWidth: true,
    },
    {
      name: "accountNumber",
      label: "Account number",
      placeholder: "9 to 18 digits",
      sanitize: digits,
      maxLength: 18,
      inputMode: "numeric",
    },
    {
      name: "confirmAccountNumber",
      label: "Re-enter account number",
      placeholder: "Type it again",
      sanitize: digits,
      maxLength: 18,
      inputMode: "numeric",
      matches: "accountNumber",
    },
    {
      name: "ifsc",
      label: "IFSC code",
      placeholder: "e.g. HDFC0001234",
      sanitize: alphanumericUpper,
      maxLength: 11,
    },
    { name: "bankName", label: "Bank name", icon: "bank", placeholder: "e.g. HDFC Bank" },
  ],
};
export const documentFields: {
  label: string;
  /** What the card says under its title. */
  note: string;
  /** Left out of the required mark. */
  optional?: boolean;
  file: FieldPath<RegistrationForm>;
  number: FieldDefinition;
  /** Extra fields shown under the number, e.g. an expiry date. */
  extra?: FieldDefinition[];
}[] = [
  {
    label: "GST certificate",
    note: "GSTIN and certificate",
    file: "documents.gst",
    number: {
      name: "documentNumbers.gst",
      label: "GSTIN",
      icon: "hash",
      placeholder: "Enter GST no.",
      hint: "15 characters, e.g. 29ABCDE1234F1Z5",
      sanitize: alphanumericUpper,
      maxLength: 15,
    },
  },
  {
    label: "PAN card",
    note: "PAN number and card copy",
    file: "documents.pan",
    number: {
      name: "documentNumbers.pan",
      label: "PAN number",
      icon: "hash",
      placeholder: "Enter PAN no.",
      hint: "10 characters, e.g. ABCDE1234F",
      sanitize: alphanumericUpper,
      maxLength: 10,
    },
  },
  {
    label: "FSSAI",
    note: "Licence number, valid until and licence copy",
    file: "documents.fssai",
    number: {
      name: "documentNumbers.fssai",
      label: "FSSAI number",
      icon: "hash",
      placeholder: "Enter FSSAI no.",
      hint: "14 digits",
      sanitize: digits,
      maxLength: 14,
      inputMode: "numeric",
    },
    extra: [
      {
        name: "documentNumbers.fssaiExpiry",
        label: "Valid until",
        icon: "calendar",
        placeholder: "DD / MM / YYYY",
        type: "date",
      },
    ],
  },
  {
    label: "Identity",
    note: "Owner Aadhaar number and copy",
    file: "documents.identity",
    number: {
      name: "documentNumbers.identity",
      label: "Aadhaar number",
      icon: "hash",
      placeholder: "Enter Aadhaar no.",
      hint: "12 digits",
      sanitize: digits,
      maxLength: 12,
      inputMode: "numeric",
    },
  },
  {
    label: "Business proof",
    note: "Shop licence or trade licence and number",
    file: "documents.businessProof",
    number: {
      name: "documentNumbers.businessProof",
      label: "Registration / licence number",
      icon: "hash",
      placeholder: "Enter licence no.",
      sanitize: (value) => value.toUpperCase(),
      maxLength: 30,
    },
  },
];
const names = (id: StepId) => (fieldGroups[id] ?? []).map((f) => f.name);
export const stepFields: Record<StepId, FieldPath<RegistrationForm>[]> = {
  details: [...names("details"), "coverPhoto", "logo"],
  location: ["address", "latitude", "longitude", ...names("location")],
  documents: documentFields.flatMap((f) => [
    f.number.name,
    ...(f.extra ?? []).map((e) => e.name),
    f.file,
  ]),
  bank: [...names("bank"), "bankProof"],
  menu: ["menuItems"],
  hours: ["hours"],
  review: ["agreement"],
};
