"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { Box } from "@mui/material";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { useChangeRequestFormViewModel } from "../viewmodels/useChangeRequestFormViewModel";
/** Restaurant and owner names; they wait for admin approval before they change. */
export function ChangeRequestForm({ onSent }: { onSent: () => void }) {
  const { values, set, busy, error, sent, submit } =
    useChangeRequestFormViewModel(onSent);
  return (
    <form noValidate onSubmit={submit}>
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
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
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
      </Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <CommonButton type="submit" variant="contained" disabled={busy}>
          {busy ? "Sending…" : "Request approval"}
        </CommonButton>
      </Box>
    </form>
  );
}
