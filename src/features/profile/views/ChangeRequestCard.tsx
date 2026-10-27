"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { useState, type ReactNode } from "react";
import { Box, Chip, Typography } from "@mui/material";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { DocumentUpload } from "@/shared/components/form/DocumentUpload";
import { useChangeRequestFormViewModel } from "../viewmodels/useChangeRequestFormViewModel";
import {
  type ProfileChangeRequest,
  type RestaurantDetails,
} from "../services/restaurantApi";
/** How many of the newest requests are listed before "See more requests". */
const LATEST_REQUESTS = 3;
const FIELD_LABELS: Record<string, string> = {
  rest_name: "Restaurant name",
  owner_name: "Owner name",
  restaurant_type: "Restaurant type",
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
const STATUS_COLOR = {
  pending: "warning",
  approved: "success",
  accepted: "success",
  rejected: "error",
} as const;
/** One identity document: its number on the left, its file on the right, centred together. */
function DocumentRow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box
      className="full"
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: 1,
        borderColor: "divider",
        borderRadius: "14px",
        bgcolor: "#fcfcfb",
      }}
    >
      <Typography sx={{ fontWeight: 700, mb: 2 }}>{title}</Typography>
      <Box
        sx={{
          display: "grid",
          gap: 2,
          alignItems: "center",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
/** Names and documents; they wait for admin approval before they change. */
export function ChangeRequestForm({
  onSent,
  details,
}: {
  onSent: () => void;
  details?: RestaurantDetails | null;
}) {
  const { values, set, busy, error, sent, submit } =
    useChangeRequestFormViewModel(onSent);
  return (
    <form noValidate onSubmit={submit}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        These details need admin approval and stay unchanged until approved.
        Leave a field empty to keep it as is.
      </Typography>
      {sent && (
        <ToastAlert severity="success" sx={{ mb: 2 }}>
          Request sent. An admin will review it.
        </ToastAlert>
      )}
      {error && (
        <ToastAlert severity="error" sx={{ mb: 2 }}>
          {error}
        </ToastAlert>
      )}
      <div className="form-grid compact-grid">
        <CommonTextField
          label="Restaurant name"
          value={values.restaurantName}
          onChange={(e) => set("restaurantName", e.target.value)}
        />
        <CommonTextField
          label="Owner name"
          value={values.ownerName}
          onChange={(e) => set("ownerName", e.target.value)}
        />
        <DocumentRow title="GST">
          <CommonTextField
            label="GSTIN"
            value={values.gst}
            onChange={(e) =>
              set("gst", e.target.value.toUpperCase().slice(0, 15))
            }
          />
          <DocumentUpload
            title="GST certificate"
            value={values.gstDocument}
            onChange={(file) => set("gstDocument", file)}
            currentUrl={details?.documents.gst}
          />
        </DocumentRow>
        <DocumentRow title="PAN">
          <CommonTextField
            label="PAN number"
            value={values.panNumber}
            onChange={(e) =>
              set("panNumber", e.target.value.toUpperCase().slice(0, 10))
            }
          />
          <DocumentUpload
            title="PAN card"
            value={values.pan}
            onChange={(file) => set("pan", file)}
            currentUrl={details?.documents.pan}
          />
        </DocumentRow>
        <DocumentRow title="Aadhaar">
          <CommonTextField
            label="Aadhaar number"
            value={values.aadhaarNumber}
            onChange={(e) =>
              set(
                "aadhaarNumber",
                e.target.value.replace(/\D/g, "").slice(0, 12),
              )
            }
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
          />
          <DocumentUpload
            title="Aadhaar card"
            value={values.aadhaar}
            onChange={(file) => set("aadhaar", file)}
            currentUrl={details?.documents.aadhaar}
          />
        </DocumentRow>
      </div>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <CommonButton type="submit" variant="contained" disabled={busy}>
          {busy ? "Sending…" : "Request approval"}
        </CommonButton>
      </Box>
    </form>
  );
}
/** Past requests and whether an admin approved them. */
export function ChangeRequestHistory({
  requests,
}: {
  requests: ProfileChangeRequest[];
}) {
  const [showAll, setShowAll] = useState(false);
  if (!requests.length) return null;
  // Newest first; only the latest few until the vendor asks for the rest.
  const sorted = [...requests].sort(
      (a, b) =>
        (Date.parse(b.createdAt ?? "") || 0) -
        (Date.parse(a.createdAt ?? "") || 0),
    ),
    shown = showAll ? sorted : sorted.slice(0, LATEST_REQUESTS),
    older = sorted.length - LATEST_REQUESTS;
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Your requests
      </Typography>
      {shown.map((request) => (
        <Box
          key={request.id}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 600 }}>
              {[
                ...new Set(request.fields.map((key) => FIELD_LABELS[key])),
              ].join(", ") || "Profile change"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {request.createdAt
                ? new Date(request.createdAt).toLocaleString()
                : ""}
              {request.reason ? ` · ${request.reason}` : ""}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={request.status}
            color={
              STATUS_COLOR[
                request.status.toLowerCase() as keyof typeof STATUS_COLOR
              ] ?? "default"
            }
            sx={{ textTransform: "capitalize" }}
          />
        </Box>
      ))}
      {older > 0 && (
        <CommonButton
          variant="text"
          onClick={() => setShowAll((all) => !all)}
          sx={{ mt: 1, ml: -1, fontWeight: 700 }}
        >
          {showAll ? "Show fewer requests" : `See more requests (${older})`}
        </CommonButton>
      )}
    </Box>
  );
}
