import { baseApi, flow, type Send } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import { fetchCuisines } from "@/features/onboarding/services/cuisineApi";
export interface RestaurantSummary {
  name?: string;
  city?: string;
  ownerName?: string;
  phone?: string;
  email?: string;
  /** True when the owner has the restaurant ACTIVE (taking orders). */
  active?: boolean;
}
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const first = (...values: unknown[]) => values.map(text).find(Boolean);
/**
 * GET /restaurant/profile: the signed-in restaurant's profile. The
 * response shape is not documented, so the likely key names are all read.
 */
async function getMyRestaurant(send: Send): Promise<RestaurantSummary> {
  const data = await send({ url: endpoint(API_PATHS.restaurantMe) });
  const body = (data?.data ?? data) as Record<string, unknown>;
  const restaurant = (body?.restaurant ?? body?.profile ?? body) as Record<
    string,
    unknown
  >;
  return {
    name: first(
      restaurant?.rest_name,
      restaurant?.restaurant_name,
      restaurant?.name,
    ),
    city: first(restaurant?.city),
    ownerName: first(
      restaurant?.owner_name,
      restaurant?.full_name,
      restaurant?.ownerName,
    ),
    phone: first(
      restaurant?.restaurant_contact,
      restaurant?.phone,
      restaurant?.mobile,
    ),
    email: first(restaurant?.email, restaurant?.owner_email),
    active: ownerActive(restaurant?.owner_restaurant_status),
  };
}
const ownerActive = (value: unknown) => {
  const status = text(value)?.toUpperCase();
  return status ? status === "ACTIVE" : undefined;
};
/**
 * PATCH /restaurant/profile/status: the owner switches the restaurant ACTIVE
 * (online) or INACTIVE (offline). Takes effect at once, no approval needed.
 */
async function setRestaurantActive(active: boolean, send: Send) {
  await send({
    url: `${endpoint(API_PATHS.restaurantMe)}/status`,
    method: "patch",
    data: { owner_restaurant_status: active ? "ACTIVE" : "INACTIVE" },
  });
}
const profilePath = (page: string) =>
  `${endpoint(API_PATHS.restaurantMe)}/${page}`;
/**
 * PATCH /restaurant/profile/restaurant-details: the contact number, logo and
 * cover are saved straight away. (Name, owner and type need approval; see
 * requestProfileChange.)
 */
async function updateRestaurantProfile(
  changes: { contact?: string; logo?: File | null; cover?: File | null },
  send: Send,
) {
  const body = new FormData();
  if (changes.contact) body.append("restaurant_contact", changes.contact);
  if (changes.logo) body.append("logo", changes.logo);
  if (changes.cover) body.append("cover", changes.cover);
  await send({
    url: profilePath("restaurant-details"),
    method: "patch",
    data: body,
  });
}
export type ProfileChangeRequestInput = ProfileChangeInput;
export interface ProfileChangeInput {
  rest_name?: string;
  owner_name?: string;
  restaurant_type?: string;
  gst?: string;
  gst_document?: File | null;
  pan_number?: string;
  pan_card?: File | null;
  aadhaar_number?: string;
  adhaar_card?: File | null;
  fssai_number?: string;
  fssai_expiry_date?: string;
  fssai?: File | null;
  business_proof_number?: string;
  business_proof?: File | null;
  // A new location; the server must accept these to approve a move.
  house_no?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number | null;
  lon?: number | null;
}
export interface ProfileChangeRequest {
  id: string;
  status: string;
  createdAt?: string;
  fields: string[];
  reason?: string;
}
const DETAIL_FIELDS = ["rest_name", "owner_name", "restaurant_type"],
  LOCATION_FIELDS = [
    "house_no",
    "landmark",
    "city",
    "state",
    "pincode",
    "lat",
    "lon",
  ];
const hasValue = (value: unknown) =>
  value !== undefined && value !== null && value !== "";
/**
 * Changes that wait for admin approval. Each field goes to the page that
 * owns it: name, owner and type to restaurant-details, address and map
 * position to location (JSON), and GST, PAN, Aadhaar, FSSAI and business
 * proof to business-documents. A change already under review is refused by
 * the server (409).
 */
async function requestProfileChange(changes: ProfileChangeInput, send: Send) {
  const entries = Object.entries(changes).filter(([, v]) => hasValue(v));
  const pick = (keys: string[]) =>
    entries.filter(([key]) => keys.includes(key));
  const details = pick(DETAIL_FIELDS),
    place = pick(LOCATION_FIELDS),
    documents = entries.filter(
      ([key]) => ![...DETAIL_FIELDS, ...LOCATION_FIELDS].includes(key),
    );
  const form = (rows: [string, unknown][]) => {
    const body = new FormData();
    rows.forEach(([key, value]) =>
      body.append(key, value instanceof File ? value : String(value)),
    );
    return body;
  };
  // One at a time: the server allows a single request under review.
  if (details.length)
    await send({
      url: profilePath("restaurant-details"),
      method: "patch",
      data: form(details),
    });
  if (place.length)
    await send({
      url: profilePath("location"),
      method: "patch",
      data: Object.fromEntries(place),
    });
  if (documents.length)
    await send({
      url: profilePath("business-documents"),
      method: "patch",
      data: form(documents),
    });
}
const FIELD_KEYS = [
  "rest_name",
  "owner_name",
  "restaurant_type",
  "fssai_number",
  "fssai_expiry_date",
  "fssai",
  "business_proof_number",
  "business_proof",
  "gst",
  "gst_document",
  "pan_number",
  "pan_card",
  "aadhaar_number",
  "adhaar_card",
  "house_no",
  "landmark",
  "city",
  "state",
  "pincode",
  "lat",
  "lon",
];
/** GET /restaurant/profile/change-requests: this restaurant's requests. */
async function getProfileChangeRequests(
  send: Send,
): Promise<ProfileChangeRequest[]> {
  const data = await send({ url: endpoint(API_PATHS.profileChangeRequests) });
  const body = data?.data ?? data;
  const rows: Record<string, unknown>[] = Array.isArray(body)
    ? body
    : Array.isArray(body?.requests)
      ? body.requests
      : [];
  return rows.map((row, index) => {
    const requested = (row.requested_changes ?? row.changes ?? row) as Record<
      string,
      unknown
    >;
    return {
      id: String(row.id ?? index),
      status: text(row.status) ?? "pending",
      createdAt: first(row.created_at, row.createdAt),
      fields: FIELD_KEYS.filter((key) => requested?.[key]),
      reason: first(row.rejection_reason, row.reason, row.remarks),
    };
  });
}
export interface WorkingDay {
  day: string;
  open: boolean;
  start: string;
  end: string;
}
export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const DEFAULT_OPENS = "09:00";
export const DEFAULT_CLOSES = "22:00";
const hhmm = (value: unknown) => text(value)?.slice(0, 5);
/**
 * Reads one day of the saved hours. The profile GET is undocumented, so it
 * accepts the PATCH shape ({ open, close }) and the registration shape
 * ({ is_open, slots: [{ opening_time, closing_time }] }).
 */
function readDay(day: string, raw: unknown): WorkingDay {
  const closed: WorkingDay = {
    day,
    open: false,
    start: DEFAULT_OPENS,
    end: DEFAULT_CLOSES,
  };
  if (!raw || typeof raw !== "object") return closed;
  const row = raw as Record<string, unknown>;
  if (row.is_open === false) return closed;
  if (row.is_24_hours === true)
    return { day, open: true, start: "00:00", end: "23:59" };
  const slots = Array.isArray(row.slots)
    ? (row.slots as Record<string, unknown>[])
    : [];
  const start = hhmm(row.open) ?? hhmm(slots[0]?.opening_time),
    end = hhmm(row.close) ?? hhmm(slots[slots.length - 1]?.closing_time);
  return start && end ? { day, open: true, start, end } : closed;
}
/** GET /restaurant/profile/operating-hours: the weekly hours the restaurant is open. */
async function getWorkingHours(send: Send): Promise<WorkingDay[]> {
  const data = await send({ url: profilePath("operating-hours") });
  const body = (data?.data ?? data) as Row;
  return hoursOf(
    (body?.operating_hours ?? body?.opening_hours ?? body) as Row,
    true,
  );
}
type Row = Record<string, unknown>;
async function fetchRestaurantRow(send: Send): Promise<Row> {
  const data = await send({ url: endpoint(API_PATHS.restaurantMe) });
  const body = (data?.data ?? data) as Row;
  return (body?.restaurant ?? body?.profile ?? body) as Row;
}
function hoursOf(restaurant: Row, isSchedule = false): WorkingDay[] {
  let hours = isSchedule
    ? restaurant
    : (restaurant?.opening_hours ?? restaurant?.operating_hours);
  if (typeof hours === "string") {
    try {
      hours = JSON.parse(hours);
    } catch {
      hours = undefined;
    }
  }
  const byDay = (hours && typeof hours === "object" ? hours : {}) as Record<
    string,
    unknown
  >;
  return WEEK_DAYS.map((day) => {
    const full = day.toLowerCase();
    return readDay(day, byDay[full] ?? byDay[full.slice(0, 3)]);
  });
}
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
/**
 * PATCH /restaurant/profile/operating-hours: the weekly schedule keyed mon to
 * sun, in the registration format. Saved immediately.
 */
async function updateWorkingHours(days: WorkingDay[], send: Send) {
  const schedule: Record<string, unknown> = {};
  days.forEach((d, index) => {
    const around = d.open && d.start === "00:00" && d.end === "23:59";
    schedule[DAY_KEYS[index]] = {
      is_open: d.open,
      is_24_hours: around,
      slots:
        d.open && !around
          ? [{ opening_time: d.start, closing_time: d.end }]
          : [],
    };
  });
  await send({
    url: profilePath("operating-hours"),
    method: "patch",
    data: schedule,
  });
}
/** POST /auth/restaurant/change-password for the signed-in restaurant. */
async function changePassword(
  {
    currentPassword,
    newPassword,
  }: { currentPassword: string; newPassword: string },
  send: Send,
) {
  await send({
    url: endpoint(API_PATHS.changePassword),
    method: "post",
    data: { current_password: currentPassword, new_password: newPassword },
  });
}
export interface RestaurantDetails {
  name?: string;
  ownerName?: string;
  type?: string;
  cuisines: string[];
  email?: string;
  mobile?: string;
  contact?: string;
  fssai?: string;
  status?: string;
  logoUrl?: string;
  coverUrl?: string;
  gstin?: string;
  /** Signed links to the documents already on record. */
  documents: {
    gst?: string;
    pan?: string;
    aadhaar?: string;
    bankProof?: string;
  };
  location: {
    building?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude: number | null;
    longitude: number | null;
  };
  hours: WorkingDay[];
  bank: { holder?: string; bank?: string; account?: string; ifsc?: string };
}
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const numberOf = (...values: unknown[]) => {
  const found = first(...values);
  return found !== undefined && Number.isFinite(Number(found))
    ? Number(found)
    : null;
};
/** "restaurant" → "Restaurant", "cloud_kitchen" → "Cloud kitchen". */
const label = (value: string | undefined) =>
  value
    ? value.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase())
    : undefined;
/**
 * Everything shown on the profile page, from GET /restaurant/profile. The
 * response is not documented, so likely names are read, including nested
 * "location" and "bank_account" objects.
 */
async function getRestaurantDetails(send: Send): Promise<RestaurantDetails> {
  const row = await fetchRestaurantRow(send);
  // The profile may hold cuisine ids (e.g. C2803947234); show their names.
  const cuisineNames = new Map(
    (await fetchCuisines(send).catch(() => [])).map((c) => [c.id, c.name]),
  );
  const place = asRow(row.location ?? row.restaurant_location),
    bank = asRow(row.bank_account ?? row.bank ?? row.bank_details);
  const cuisines = row.cuisines ?? row.cusines;
  const pick = (...keys: string[]) =>
    first(...keys.map((k) => place[k]), ...keys.map((k) => row[k]));
  return {
    name: first(row.rest_name, row.restaurant_name, row.name),
    ownerName: first(row.owner_name, row.full_name),
    type: label(first(row.restaurant_type, row.type)),
    cuisines: (Array.isArray(cuisines) ? cuisines : [])
      .map((c) => {
        const value =
          typeof c === "string" ? c : first(asRow(c).name, asRow(c).cuisine_id);
        return value && (cuisineNames.get(value) ?? value);
      })
      .filter((c): c is string => !!c),
    email: first(row.email, row.restaurant_email, row.owner_email),
    mobile: first(row.mobile, row.owner_mobile, row.phone),
    contact: first(row.restaurant_contact),
    fssai: first(row.fssai_number, row.fssai),
    status: label(first(row.review_status, row.status)),
    logoUrl: first(row.logo_url, row.logo),
    coverUrl: first(row.cover_url, row.cover, row.cover_image),
    gstin: first(row.gstin, row.gst),
    documents: {
      gst: first(row.gst_document_url),
      pan: first(row.pan_document_url),
      aadhaar: first(row.aadhaar_document_url),
      bankProof: first(row.bank_proof_url),
    },
    location: {
      building: pick("house_no", "building"),
      landmark: pick("landmark"),
      city: pick("city"),
      state: pick("state"),
      pincode: pick("pincode"),
      latitude: numberOf(place.lat, place.latitude, row.lat, row.latitude),
      longitude: numberOf(
        place.lon,
        place.lng,
        place.longitude,
        row.lon,
        row.longitude,
      ),
    },
    hours: hoursOf(row),
    bank: {
      holder: first(bank.account_holder_name, row.account_holder_name),
      bank: first(bank.bank_name, bank.Bank_name, row.bank_name),
      account: first(bank.account_number, row.account_number),
      ifsc: first(bank.ifsc, bank.IFSC, row.ifsc),
    },
  };
}
export interface BankAccountInput {
  holder: string;
  account: string;
  ifsc: string;
  bank: string;
  proof: File;
}
/** PUT /restaurant/profile/bank-account: replaces every bank detail at once. */
async function replaceBankAccount(input: BankAccountInput, send: Send) {
  const body = new FormData();
  body.append("account_holder_name", input.holder);
  body.append("account_number", input.account);
  body.append("ifsc", input.ifsc);
  body.append("bank_name", input.bank);
  body.append("bank_proof", input.proof);
  await send({
    url: `${endpoint(API_PATHS.restaurantMe)}/bank-account`,
    method: "put",
    data: body,
  });
}

export const restaurantApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyRestaurant: build.query<RestaurantSummary, void>({
      queryFn: flow((_: void, send: Send) => getMyRestaurant(send)),
      providesTags: ["Profile"],
    }),
    getRestaurantDetails: build.query<RestaurantDetails, void>({
      queryFn: flow((_: void, send: Send) => getRestaurantDetails(send)),
      providesTags: ["Profile"],
    }),
    getWorkingHours: build.query<WorkingDay[], void>({
      queryFn: flow((_: void, send: Send) => getWorkingHours(send)),
      providesTags: ["Hours"],
    }),
    getProfileChangeRequests: build.query<ProfileChangeRequest[], void>({
      queryFn: flow((_: void, send: Send) => getProfileChangeRequests(send)),
      providesTags: ["ChangeRequests"],
    }),
    setRestaurantActive: build.mutation<void, boolean>({
      queryFn: flow(setRestaurantActive),
    }),
    updateRestaurantProfile: build.mutation<
      void,
      { contact?: string; logo?: File | null; cover?: File | null }
    >({
      queryFn: flow(updateRestaurantProfile),
      invalidatesTags: ["Profile"],
    }),
    requestProfileChange: build.mutation<void, ProfileChangeInput>({
      queryFn: flow(requestProfileChange),
      invalidatesTags: ["ChangeRequests"],
    }),
    updateWorkingHours: build.mutation<void, WorkingDay[]>({
      queryFn: flow(updateWorkingHours),
      invalidatesTags: ["Hours", "Profile"],
    }),
    changePassword: build.mutation<
      void,
      { currentPassword: string; newPassword: string }
    >({
      queryFn: flow(changePassword),
    }),
    replaceBankAccount: build.mutation<void, BankAccountInput>({
      queryFn: flow(replaceBankAccount),
      invalidatesTags: ["Profile"],
    }),
  }),
});
export const {
  useLazyGetMyRestaurantQuery,
  useGetRestaurantDetailsQuery,
  useGetWorkingHoursQuery,
  useGetProfileChangeRequestsQuery,
  useSetRestaurantActiveMutation,
  useUpdateRestaurantProfileMutation,
  useRequestProfileChangeMutation,
  useUpdateWorkingHoursMutation,
  useChangePasswordMutation,
  useReplaceBankAccountMutation,
} = restaurantApi;
