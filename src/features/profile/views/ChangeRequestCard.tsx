"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { DocumentUpload } from "@/shared/components/form/DocumentUpload";
import { useChangeRequestFormViewModel } from "../viewmodels/useChangeRequestFormViewModel";
import type { RestaurantDetails } from "../services/restaurantApi";
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
