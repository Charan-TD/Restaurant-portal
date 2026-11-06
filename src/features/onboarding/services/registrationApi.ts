import { baseApi, flow, type Send } from "@/core/api/baseApi";
import { API_PATHS, endpoint, DEMO_MODE } from "@/core/constants/config";
import type { StepId } from "@/core/constants/onboarding";
import type { SavedFile } from "./registrationExtras";
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
/** 20 random characters with an upper and lower case letter, a digit and a symbol. */
function randomPassword() {
  const pools = [
      "ABCDEFGHJKLMNPQRSTUVWXYZ",
      "abcdefghijkmnopqrstuvwxyz",
      "23456789",
      "!@#$%^&*",
    ],
    all = pools.join(""),
    pick = (set: string) => {
      const n = new Uint32Array(1);
      crypto.getRandomValues(n);
      return set[n[0] % set.length];
    };
  const chars = [...pools.map(pick), ...Array.from({ length: 16 }, () => pick(all))];
  // Shuffle so the guaranteed characters are not always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const n = new Uint32Array(1);
    crypto.getRandomValues(n);
    const j = n[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
async function createRegistration(
  form: RegistrationForm,
  send: Send,
): Promise<string> {
  // Multipart, so the optional logo and cover picture go in the same request.
  // List fields are sent as one entry per value.
  const data = multipart({
    restaurant_name: form.restaurantName,
    owner_name: form.ownerName,
    mobile: `${COUNTRY_CODE}${form.mobile}`,
    restaurant_type: form.restaurantType
      ? restaurantTypeValues[form.restaurantType]
      : "",
    riders_owner: form.riderOwner,
    restaurant_email: form.email,
    restaurant_contact: `${COUNTRY_CODE}${form.customerContact}`,
    // Sign-in is by OTP, so the vendor is never asked for a password; the
    // backend still wants one, so it gets a random one nobody needs to know.
    password: form.password || randomPassword(),
    logo: form.logo,
    cover: form.coverPhoto,
  });
  form.cuisines.forEach((id) => data.append("cusines", id));
  form.foodServed.forEach((type) =>
    data.append("food_served", foodTypeValues[type]),
  );
  const body = await send<{ data: { registrationId: string } }>({
    url: `${endpoint(API_PATHS.register)}/restaurant-details`,
    method: "post",
    data,
  });
  return body.data.registrationId;
}
/**
 * PUT /registration/{id}/restaurant-details: edits the details saved in step 1.
 * The mobile number is never sent (it was verified by OTP and cannot change);
 * the password only when the vendor typed a new one; the pictures only when
 * new ones were chosen.
 */
async function updateRegistrationDetails(
  id: string,
  form: RegistrationForm,
  send: Send,
) {
  const data = multipart({
    restaurant_name: form.restaurantName,
    owner_name: form.ownerName,
    restaurant_type: form.restaurantType
      ? restaurantTypeValues[form.restaurantType]
      : "",
    riders_owner: form.riderOwner,
    restaurant_email: form.email,
    restaurant_contact: `${COUNTRY_CODE}${form.customerContact}`,
    password: form.password,
    logo: form.logo,
    cover: form.coverPhoto,
  });
  form.cuisines.forEach((cuisine) => data.append("cusines", cuisine));
  form.foodServed.forEach((type) =>
    data.append("food_served", foodTypeValues[type]),
  );
  try {
    await send({
      url: stepPath(id, "restaurant-details"),
      method: "put",
      data,
    });
  } catch (e) {
    // The server may not take edits to this step yet.
    const status = (e as { status?: number })?.status,
      message = String((e as { message?: string })?.message ?? "");
    if (status === 405 || (status === 404 && !/registration/i.test(message)))
      throw new Error(
        "Editing the restaurant details is not available yet. Please contact TrainDhaba support.",
      );
    throw e;
  }
}
const savers: Partial<
  Record<
    StepId,
    (id: string, form: RegistrationForm, send: Send) => Promise<unknown>
  >
> = {
  location: (id, form, send) =>
    send({
      url: stepPath(id, "location"),
      method: "put",
      data: {
        lat: form.latitude,
        lon: form.longitude,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        landmark: form.landmark,
        house_no: form.building,
      },
    }),
  documents: (id, { documentNumbers: numbers, documents }, send) =>
    send({
      url: stepPath(id, "business-documents"),
      method: "put",
      data: multipart({
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
    }),
  bank: (id, form, send) =>
    send({
      url: stepPath(id, "bank-account"),
      method: "put",
      data: multipart({
        account_holder_name: form.accountHolder,
        account_number: form.accountNumber,
        IFSC: form.ifsc,
        Bank_name: form.bankName,
        bank_proof: form.bankProof,
      }),
    }),
  hours: (id, form, send) =>
    send({
      url: stepPath(id, "operating-hours"),
      method: "put",
      data: Object.fromEntries(
        form.hours.map((day) => {
          const around =
            day.open &&
            day.shifts.length === 1 &&
            day.shifts[0].start === "00:00" &&
            day.shifts[0].end === "23:59";
          return [
            dayKeys[day.day],
            {
              is_open: day.open,
              is_24_hours: around,
              slots:
                day.open && !around
                  ? // The backend wants a day's slots in time order.
                    [...day.shifts]
                      .sort((a, b) => a.start.localeCompare(b.start))
                      .map((shift) => ({
                        opening_time: shift.start,
                        closing_time: shift.end,
                      }))
                  : [],
            },
          ];
        }),
      ),
    }),
};
/**
 * Saves one step and returns the registration id to use for the next steps.
 * The details step is created once, then edited with PUT.
 */
async function saveRegistrationStep(
  {
    step,
    form,
    registrationId,
  }: { step: StepId; form: RegistrationForm; registrationId: string | null },
  send: Send,
): Promise<string | null> {
  if (DEMO_MODE) return registrationId;
  if (step === "details") {
    if (registrationId) {
      await updateRegistrationDetails(registrationId, form, send);
      return registrationId;
    }
    return createRegistration(form, send);
  }
  const save = savers[step];
  if (!save) return registrationId;
  if (!registrationId)
    throw new Error("Please complete the restaurant details step first.");
  await save(registrationId, form, send);
  return registrationId;
}
/**
 * Tells the backend every section is done. It re-checks completeness and
 * answers 400 with the missing sections if something was not saved.
 */
async function submitRegistration(registrationId: string, send: Send) {
  if (DEMO_MODE) return;
  await send({ url: stepPath(registrationId, "submit"), method: "post" });
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
/** The uploaded files a section says it holds, by the id the backend keeps for each. */
const held = (row: Row, ids: [SavedFile, string][]) =>
  ids.filter(([, key]) => !!row[key]).map(([file]) => file);
const loaders: Record<
  string,
  {
    step: StepId;
    path: string;
    read: (row: Row) => Partial<RegistrationForm>;
    files?: (row: Row) => SavedFile[];
  }
> = {
  restaurant_details: {
    step: "details",
    path: "restaurant-details",
    files: (row) =>
      held(row, [
        ["logo", "logo_id"],
        ["cover", "cover_id"],
      ]),
    read: (row) => {
      const type = reverse(restaurantTypeValues, row.restaurant_type),
        food = Array.isArray(row.food_served) ? row.food_served : [],
        cuisines = row.cusines ?? row.cuisines;
      const owner = str(row, "riders_owner").toLowerCase();
      return {
        riderOwner:
          owner === "traindhaba"
            ? "Traindhaba"
            : owner === "restaurant"
              ? "restaurant"
              : "",
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
    files: (row) =>
      held(row, [
        ["fssai", "fssai_document_id"],
        ["pan", "pan_document_id"],
        ["gst", "gst_document_id"],
        ["businessProof", "business_proof_document_id"],
        ["identity", "aadhaar_document_id"],
      ]),
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
    files: (row) => held(row, [["bankProof", "bank_proof_id"]]),
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
            // A 24-hour day is saved with no slots.
            shifts:
              saved?.is_open === true && saved?.is_24_hours === true
                ? [{ start: "00:00", end: "23:59" }]
                : slots.map((slot) => ({
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
  /** Files the backend already holds, so they show as uploaded. */
  files: SavedFile[];
}
/**
 * Reads back every section the backend marks as saved, using the progress
 * endpoint to know which ones to ask for.
 */
async function loadRegistration(
  registrationId: string,
  send: Send,
): Promise<SavedRegistration> {
  const data = await send({ url: stepPath(registrationId, "progress") });
  const sections = asRow(unwrap(data).sections),
    done = Object.keys(loaders).filter((name) => sections[name] === true);
  const parts = await Promise.all(
    done.map(async (name) => {
      const loader = loaders[name];
      try {
        const response = await send({
          url: stepPath(registrationId, loader.path),
        });
        const row = unwrap(response);
        return {
          step: loader.step,
          values: loader.read(row),
          files: loader.files?.(row) ?? [],
        };
      } catch {
        // A section that fails to load is still saved; it just stays empty.
        return { step: loader.step, values: {}, files: [] as SavedFile[] };
      }
    }),
  );
  return {
    completed: parts.map((part) => part.step),
    values: Object.assign({}, ...parts.map((part) => part.values)),
    files: parts.flatMap((part) => part.files),
  };
}

export const registrationApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    saveRegistrationStep: build.mutation<
      string | null,
      {
        step: StepId;
        form: RegistrationForm;
        registrationId: string | null;
      }
    >({ queryFn: flow(saveRegistrationStep) }),
    submitRegistration: build.mutation<void, string>({
      queryFn: flow(submitRegistration),
    }),
    loadRegistration: build.query<SavedRegistration, string>({
      queryFn: flow(loadRegistration),
    }),
  }),
});
export const {
  useSaveRegistrationStepMutation,
  useSubmitRegistrationMutation,
  useLazyLoadRegistrationQuery,
} = registrationApi;
