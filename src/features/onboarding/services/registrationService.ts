import { api } from "@/core/api/axios";
import { API_PATHS, endpoint, DEMO_MODE } from "@/core/constants/config";
import type { StepId } from "@/core/constants/onboarding";
import {
  COUNTRY_CODE,
  type FoodType,
  type RegistrationForm,
  type RestaurantType,
} from "../models/registration";
// The backend saves registration one step at a time. Step 1 creates the
// registration and returns its id; the other steps update it by that id.
const restaurantTypeValues: Record<RestaurantType, string> = {
  Restaurant: "restaurant",
  "Cloud kitchen": "cloud_kitchen",
};
const foodTypeValues: Record<FoodType, string> = {
  Veg: "veg",
  Egg: "egg",
  "Non-veg": "non_veg",
};
const dayKeys: Record<string, string> = {
  Monday: "mon",
  Tuesday: "tue",
  Wednesday: "wed",
  Thursday: "thu",
  Friday: "fri",
  Saturday: "sat",
  Sunday: "sun",
};
const stepPath = (registrationId: string, step: string) =>
  `${endpoint(API_PATHS.register)}/${registrationId}/${step}`;
function multipart(fields: Record<string, string | File | null>) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value) body.append(key, value);
  });
  return body;
}
async function createRegistration(form: RegistrationForm): Promise<string> {
  const { data } = await api.post<{ data: { registrationId: string } }>(
    `${endpoint(API_PATHS.register)}/restaurant-details`,
    {
      restaurant_name: form.restaurantName,
      owner_name: form.ownerName,
      mobile: `${COUNTRY_CODE}${form.mobile}`,
      restaurant_type: form.restaurantType
        ? restaurantTypeValues[form.restaurantType]
        : "",
      restaurant_email: form.email,
      cusines: form.cuisines,
      restaurant_contact: `${COUNTRY_CODE}${form.customerContact}`,
      password: form.password,
      food_served: form.foodServed.map((type) => foodTypeValues[type]),
    },
  );
  return data.data.registrationId;
}
const savers: Partial<
  Record<StepId, (id: string, form: RegistrationForm) => Promise<unknown>>
> = {
  location: (id, form) =>
    api.put(stepPath(id, "location"), {
      lat: form.latitude,
      lon: form.longitude,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      landmark: form.landmark,
      house_no: form.building,
    }),
  documents: (id, { documentNumbers: numbers, documents }) =>
    api.put(
      stepPath(id, "business-documents"),
      multipart({
        fssai_number: numbers.fssai,
        fssai_expiry_date: numbers.fssaiExpiry,
        fssai_document: documents.fssai,
        pan_number: numbers.pan,
        pan_document: documents.pan,
        gst_number: numbers.gst,
        gst_document: documents.gst,
        business_proof_document_number: numbers.businessProof,
        business_proof_document: documents.businessProof,
        aadhaar_number: numbers.identity,
        aadhaar_document: documents.identity,
      }),
    ),
  bank: (id, form) =>
    api.put(
      stepPath(id, "bank-account"),
      multipart({
        account_holder_name: form.accountHolder,
        account_number: form.accountNumber,
        IFSC: form.ifsc,
        Bank_name: form.bankName,
        bank_proof: form.bankProof,
      }),
    ),
  hours: (id, form) =>
    api.put(
      stepPath(id, "operating-hours"),
      Object.fromEntries(
        form.hours.map((day) => [
          dayKeys[day.day],
          {
            is_open: day.open,
            is_24_hours: false,
            slots: day.open
              ? day.shifts.map((shift) => ({
                  opening_time: shift.start,
                  closing_time: shift.end,
                }))
              : [],
          },
        ]),
      ),
    ),
};
/**
 * Saves one step and returns the registration id to use for the next steps.
 * The details step has no update endpoint, so it is sent only once.
 */
export async function saveRegistrationStep(
  step: StepId,
  form: RegistrationForm,
  registrationId: string | null,
): Promise<string | null> {
  if (DEMO_MODE) return registrationId;
  if (step === "details")
    return registrationId ?? (await createRegistration(form));
  const save = savers[step];
  if (!save) return registrationId;
  if (!registrationId)
    throw new Error("Please complete the restaurant details step first.");
  await save(registrationId, form);
  return registrationId;
}
/**
 * Tells the backend every section is done. It re-checks completeness and
 * answers 400 with the missing sections if something was not saved.
 */
export async function submitRegistration(registrationId: string) {
  if (DEMO_MODE) return;
  await api.post(stepPath(registrationId, "submit"));
}
// The registration id is kept across reloads so a vendor can pick up where
// they left off. It is dropped once the registration is submitted.
const REGISTRATION_KEY = "td.registrationId";
export function rememberRegistration(registrationId: string) {
  try {
    localStorage.setItem(REGISTRATION_KEY, registrationId);
  } catch {}
}
export function rememberedRegistration(): string | null {
  try {
    return localStorage.getItem(REGISTRATION_KEY);
  } catch {
    return null;
  }
}
export function forgetRegistration() {
  try {
    localStorage.removeItem(REGISTRATION_KEY);
  } catch {}
}
type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const unwrap = (body: unknown) => {
  const outer = asRow(body);
  return asRow(outer.data ?? outer);
};
const str = (row: Row, ...keys: string[]) => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
};
const num = (row: Row, ...keys: string[]) => {
  const value = Number(str(row, ...keys));
  return str(row, ...keys) && Number.isFinite(value) ? value : null;
};
/** "+919876543210" → "9876543210", matching the form's 10-digit fields. */
const localNumber = (value: string) => value.replace(/\D/g, "").slice(-10);
/** Normalises "non veg", "non_veg" and "Non-veg" to one key. */
const enumKey = (value: unknown) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z]/g, "");
function reverse<T extends string>(values: Record<T, string>, raw: unknown) {
  return (Object.keys(values) as T[]).find(
    (key) => enumKey(values[key]) === enumKey(raw),
  );
}
// The GET responses are not documented; they are read using the same field
// names the matching save requests send.
const loaders: Record<
  string,
  { step: StepId; path: string; read: (row: Row) => Partial<RegistrationForm> }
> = {
  restaurant_details: {
    step: "details",
    path: "restaurant-details",
    read: (row) => {
      const type = reverse(restaurantTypeValues, row.restaurant_type),
        food = Array.isArray(row.food_served) ? row.food_served : [],
        cuisines = row.cusines ?? row.cuisines;
      return {
        restaurantName: str(row, "restaurant_name", "name"),
        ownerName: str(row, "owner_name"),
        mobile: localNumber(str(row, "mobile")),
        email: str(row, "restaurant_email", "email"),
        customerContact: localNumber(str(row, "restaurant_contact")),
        restaurantType: type ?? "",
        foodServed: food
          .map((value) => reverse(foodTypeValues, value))
          .filter((value): value is FoodType => !!value),
        cuisines: (Array.isArray(cuisines) ? cuisines : [])
          .map((c) => (typeof c === "string" ? c : str(asRow(c), "id")))
          .filter(Boolean),
      };
    },
  },
  restaurant_location: {
    step: "location",
    path: "location",
    read: (row) => {
      const values = {
        building: str(row, "house_no", "building"),
        landmark: str(row, "landmark"),
        city: str(row, "city"),
        state: str(row, "state"),
        pincode: str(row, "pincode"),
        latitude: num(row, "lat", "latitude"),
        longitude: num(row, "lon", "lng", "longitude"),
      };
      const address =
        str(row, "address", "formatted_address") ||
        [values.city, values.state, values.pincode].filter(Boolean).join(", ");
      return { ...values, address };
    },
  },
  business_documents: {
    step: "documents",
    path: "business-documents",
    read: (row) => ({
      documentNumbers: {
        gst: str(row, "gst_number"),
        pan: str(row, "pan_number"),
        fssai: str(row, "fssai_number"),
        fssaiExpiry: str(row, "fssai_expiry_date").slice(0, 10),
        identity: str(row, "aadhaar_number"),
        businessProof: str(row, "business_proof_document_number"),
      },
    }),
  },
  bank_account: {
    step: "bank",
    path: "bank-account",
    read: (row) => {
      const accountNumber = str(row, "account_number");
      return {
        accountHolder: str(row, "account_holder_name"),
        accountNumber,
        confirmAccountNumber: accountNumber,
        ifsc: str(row, "IFSC", "ifsc"),
        bankName: str(row, "Bank_name", "bank_name"),
      };
    },
  },
  operating_hours: {
    step: "hours",
    path: "operating-hours",
    read: (row) => {
      // Accepts { mon: {...} } as saved, or a list of { day, ... } rows.
      const list = Array.isArray(row.days ?? row.hours)
        ? ((row.days ?? row.hours) as unknown[]).map(asRow)
        : null;
      return {
        hours: Object.entries(dayKeys).map(([day, key]) => {
          const saved = list
            ? list.find((d) => enumKey(d.day).startsWith(key))
            : asRow(row[key]);
          const slots = Array.isArray(saved?.slots) ? saved.slots : [];
          return {
            day,
            open: saved?.is_open === true,
            shifts: slots.map((slot) => ({
              start: str(asRow(slot), "opening_time").slice(0, 5),
              end: str(asRow(slot), "closing_time").slice(0, 5),
            })),
          };
        }),
      };
    },
  },
};
export interface SavedRegistration {
  completed: StepId[];
  values: Partial<RegistrationForm>;
}
/**
 * Reads back every section the backend marks as saved, using the progress
 * endpoint to know which ones to ask for.
 */
export async function loadRegistration(
  registrationId: string,
): Promise<SavedRegistration> {
  const { data } = await api.get(stepPath(registrationId, "progress"));
  const sections = asRow(unwrap(data).sections),
    done = Object.keys(loaders).filter((name) => sections[name] === true);
  const parts = await Promise.all(
    done.map(async (name) => {
      const loader = loaders[name];
      try {
        const response = await api.get(stepPath(registrationId, loader.path));
        return {
          step: loader.step,
          values: loader.read(unwrap(response.data)),
        };
      } catch {
        // A section that fails to load is still saved; it just stays empty.
        return { step: loader.step, values: {} };
      }
    }),
  );
  return {
    completed: parts.map((part) => part.step),
    values: Object.assign({}, ...parts.map((part) => part.values)),
  };
}
