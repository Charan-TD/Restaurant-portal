import { baseApi, flow } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { Rider, RiderForm } from "../models/rider";
type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
const flag = (value: unknown) =>
  typeof value === "boolean" ? value : undefined;
function toRider(raw: unknown, i: number): Rider {
  const row = asRow(raw);
  return {
    // rider_id is the public code (RID-A7K9M2) an order is assigned with;
    // the add response carries only the internal id.
    id: text(row.rider_id) ?? text(row.id) ?? `rider-${i}`,
    name: text(row.rider_name) ?? "Rider",
    phone: text(row.phone_number) ?? "",
    // The list returns a signed link; the add response returns a storage id.
    photoUrl: text(row.rider_profile_img)?.startsWith("http")
      ? text(row.rider_profile_img)
      : undefined,
    addedAt: text(row.created_at),
    onDuty: flag(row.on_duty ?? row.is_on_duty),
    onDelivery:
      flag(row.on_delivery) ??
      (text(row.status)?.toUpperCase() === "ON_DELIVERY" ? true : undefined),
    deliveriesToday:
      typeof row.deliveries_today === "number" ? row.deliveries_today : undefined,
  };
}
export const riderApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /** GET /restaurant/riders: the riders this restaurant has added. */
    getRiders: build.query<Rider[], void>({
      queryFn: flow<void, Rider[]>(async (_, send) => {
        const riders = asRow(
          asRow(await send({ url: endpoint(API_PATHS.riders) })).data,
        ).riders;
        return Array.isArray(riders) ? riders.map(toRider) : [];
      }),
      providesTags: ["Riders"],
    }),
    /** POST /restaurant/riders (multipart): only the name and phone are required; the rest is optional. */
    addRider: build.mutation<void, RiderForm>({
      query: (form) => {
        const data = new FormData();
        const put = (key: string, value?: string | File) => {
          if (value instanceof File) data.append(key, value);
          else if (value?.trim()) data.append(key, value.trim());
        };
        put("rider_name", form.name);
        put("phone_number", form.phone);
        put("email", form.email);
        put("date_of_birth", form.dob);
        put("gender", form.gender);
        put("vehicle_type", form.vehicleType);
        put("vehicle_number", form.vehicleNumber);
        put("aadhaar_number", form.aadhaarNumber);
        put("pan_number", form.panNumber);
        put("license_number", form.licenseNumber);
        put("Bike_RC_number", form.rcNumber);
        put("rider_profile_img", form.photo);
        put("aadhaar_img", form.aadhaarFile);
        put("pan_img", form.panFile);
        put("license_img", form.licenseFile);
        put("bike_rc_img", form.rcFile);
        return { url: endpoint(API_PATHS.riders), method: "post", data };
      },
      invalidatesTags: ["Riders"],
    }),
    /**
     * PATCH /restaurant/riders/{rider_id}. NOT in the API docs yet (they list
     * only GET and POST on /restaurant/riders): written to the usual REST shape
     * so it works the day the backend adds it; until then the server's error shows.
     */
    updateRider: build.mutation<void, { id: string; name: string; phone: string }>({
      query: ({ id, name, phone }) => ({
        url: `${endpoint(API_PATHS.riders)}/${encodeURIComponent(id)}`,
        method: "patch",
        data: { rider_name: name, phone_number: phone },
      }),
      invalidatesTags: ["Riders"],
    }),
    /** DELETE /restaurant/riders/{rider_id}. Not in the API docs yet, see updateRider. */
    removeRider: build.mutation<void, string>({
      query: (id) => ({
        url: `${endpoint(API_PATHS.riders)}/${encodeURIComponent(id)}`,
        method: "delete",
      }),
      invalidatesTags: ["Riders"],
    }),
  }),
});
export const {
  useGetRidersQuery,
  useAddRiderMutation,
  useUpdateRiderMutation,
  useRemoveRiderMutation,
} = riderApi;
