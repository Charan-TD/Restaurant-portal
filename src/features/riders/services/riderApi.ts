import { baseApi, flow } from "@/core/api/baseApi";
import { API_PATHS, endpoint } from "@/core/constants/config";
import type { Rider, RiderForm } from "../models/rider";
type Row = Record<string, unknown>;
const asRow = (value: unknown): Row =>
  value && typeof value === "object" ? (value as Row) : {};
const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;
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
    /** POST /restaurant/riders (multipart): the picture is optional. */
    addRider: build.mutation<void, RiderForm>({
      query: ({ name, phone, photo }) => {
        const data = new FormData();
        data.append("rider_name", name);
        data.append("phone_number", phone);
        if (photo) data.append("rider_profile_img", photo);
        return { url: endpoint(API_PATHS.riders), method: "post", data };
      },
      invalidatesTags: ["Riders"],
    }),
  }),
});
export const { useGetRidersQuery, useAddRiderMutation } = riderApi;
