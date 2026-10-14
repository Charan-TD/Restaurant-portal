"use client";
import { useState, type FormEvent } from "react";
import { Alert, Box, Chip, Typography } from "@mui/material";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { DocumentUpload } from "@/shared/components/form/DocumentUpload";
import { errorMessage } from "@/shared/utils/errors";
import {
  requestProfileChange,
  type ProfileChangeRequest,
  type RestaurantDetails,
} from "../services/restaurantService";
const GST = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
const AADHAAR = /^\d{12}$/;
const FIELD_LABELS: Record<string, string> = {
  rest_name: "Restaurant name",
  owner_name: "Owner name",
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
const EMPTY = {
  restaurantName: "",
  ownerName: "",
  gst: "",
  gstDocument: null as File | null,
  panNumber: "",
  pan: null as File | null,
  aadhaarNumber: "",
  aadhaar: null as File | null,
};
/** Names and documents; they wait for admin approval before they change. */
export function ChangeRequestForm({
  onSent,
  details,
}: {
  onSent: () => void;
  details?: RestaurantDetails | null;
}) {
  const [values, setValues] = useState(EMPTY),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setValues((old) => ({ ...old, [key]: value }));
  const gst = values.gst.trim().toUpperCase(),
    pan = values.panNumber.trim().toUpperCase(),
    aadhaar = values.aadhaarNumber.trim();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSent(false);
    const changes = {
      rest_name: values.restaurantName.trim(),
      owner_name: values.ownerName.trim(),
      gst,
      gst_document: values.gstDocument,
      pan_number: pan,
      pan_card: values.pan,
      aadhaar_number: aadhaar,
      adhaar_card: values.aadhaar,
    };
    if (!Object.values(changes).some(Boolean))
      return setError("Fill in at least one field to request a change.");
    if (gst && !GST.test(gst))
      return setError("Enter a valid 15-character GSTIN.");
    if (pan && !PAN.test(pan))
      return setError("Enter a valid PAN (e.g. ABCDE1234F).");
    if (aadhaar && !AADHAAR.test(aadhaar))
      return setError("Enter a valid 12-digit Aadhaar number.");
    setBusy(true);
    setError("");
    try {
      await requestProfileChange(changes);
      setValues(EMPTY);
      setSent(true);
      onSent();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form noValidate onSubmit={submit}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        These details need admin approval and stay unchanged until approved.
        Leave a field empty to keep it as is.
      </Typography>
      {sent && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Request sent. An admin will review it.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
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
        <CommonTextField
          label="GSTIN"
          value={values.gst}
          onChange={(e) => set("gst", e.target.value.toUpperCase().slice(0, 15))}
        />
        <DocumentUpload
          title="GST certificate"
          value={values.gstDocument}
          onChange={(file) => set("gstDocument", file)}
          currentUrl={details?.documents.gst}
        />
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
        <CommonTextField
          label="Aadhaar number"
          value={values.aadhaarNumber}
          onChange={(e) =>
            set("aadhaarNumber", e.target.value.replace(/\D/g, "").slice(0, 12))
          }
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
        />
        <DocumentUpload
          title="Aadhaar card"
          value={values.aadhaar}
          onChange={(file) => set("aadhaar", file)}
          currentUrl={details?.documents.aadhaar}
        />
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
  if (!requests.length) return null;
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        Your requests
      </Typography>
      {requests.map((request) => (
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
              {[...new Set(request.fields.map((key) => FIELD_LABELS[key]))].join(
                ", ",
              ) || "Profile change"}
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
    </Box>
  );
}
