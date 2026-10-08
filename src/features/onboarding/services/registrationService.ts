import { api } from "@/core/api/axios";
import { API_PATHS, endpoint, DEMO_MODE } from "@/core/constants/config";
import { COUNTRY_CODE, type RegistrationPayload } from "../models/registration";
import type { ApprovalResult } from "@/features/approval/models/approval";
export async function submitRegistration(
  payload: RegistrationPayload,
): Promise<ApprovalResult> {
  if (DEMO_MODE)
    return { status: "Under review", restaurantName: payload.restaurantName };
  const body = new FormData();
  const { documents, bankProof, coverPhoto, logo, menuItems, ...details } =
    payload;
  body.append(
    "registration",
    JSON.stringify({
      ...details,
      mobile: `${COUNTRY_CODE}${details.mobile}`,
      customerContact: `${COUNTRY_CODE}${details.customerContact}`,
      menuItems: menuItems.map(({ image, ...item }) => {
        void image;
        return item;
      }),
    }),
  );
  Object.entries(documents).forEach(([key, file]) => {
    if (file) body.append(key, file);
  });
  if (bankProof) body.append("bankProof", bankProof);
  if (coverPhoto) body.append("coverPhoto", coverPhoto);
  if (logo) body.append("logo", logo);
  menuItems.forEach((item, i) => {
    if (item.image) body.append(`menuItemImage_${i}`, item.image);
  });
  const { data } = await api.post<ApprovalResult>(
    endpoint(API_PATHS.register),
    body,
  );
  return data;
}
// Adapt multipart field names/response DTO after receiving the backend contract.
