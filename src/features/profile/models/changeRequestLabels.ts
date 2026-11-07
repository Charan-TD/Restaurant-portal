/** What each field of a profile change request is called to the owner. */
export const FIELD_LABELS: Record<string, string> = {
  rest_name: "Restaurant name",
  owner_name: "Owner name",
  restaurant_type: "Restaurant type",
  riders_owner: "Delivery riders",
  fssai_number: "FSSAI number",
  fssai_expiry_date: "FSSAI expiry",
  fssai: "FSSAI certificate",
  business_proof_number: "Business proof number",
  business_proof: "Business proof",
  gst: "GSTIN",
  gst_document: "GST certificate",
  pan_number: "PAN number",
  pan_card: "PAN card",
  aadhaar_number: "Aadhaar number",
  adhaar_card: "Aadhaar card",
  house_no: "Location",
  landmark: "Location",
  city: "Location",
  state: "Location",
  pincode: "Location",
  lat: "Location",
  lon: "Location",
};

/** "FSSAI number, FSSAI expiry" for the fields a request touches. */
export const describeFields = (fields: string[]) =>
  [...new Set(fields.map((key) => FIELD_LABELS[key]).filter(Boolean))].join(
    ", ",
  ) || "Profile change";

/** Which request fields belong to each document row or section. */
export const FIELD_GROUPS = {
  fssai: ["fssai", "fssai_number", "fssai_expiry_date"],
  pan: ["pan_number", "pan_card"],
  gst: ["gst", "gst_document"],
  aadhaar: ["aadhaar_number", "adhaar_card"],
  businessProof: ["business_proof", "business_proof_number"],
  location: ["house_no", "landmark", "city", "state", "pincode", "lat", "lon"],
} as const;
