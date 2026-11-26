"use client";
import { useState } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField, prefixAdornment } from "@/shared/components/form/FormField";
import type { Rider } from "../models/rider";

/** Edit a rider's name and mobile number. `onSave` resolves to an error message, or "" when saved. */
export function EditRiderDialog({
  rider,
  onClose,
  onSave,
}: {
  rider?: Rider;
  onClose: () => void;
  onSave: (rider: Rider, change: { name: string; phone: string }) => Promise<string>;
}) {
  return (
    <Dialog open={!!rider} onClose={onClose} fullWidth maxWidth="xs">
      {rider && <EditBody key={rider.id} rider={rider} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

function EditBody({
  rider,
  onClose,
  onSave,
}: {
  rider: Rider;
  onClose: () => void;
  onSave: (rider: Rider, change: { name: string; phone: string }) => Promise<string>;
}) {
  const [name, setName] = useState(rider.name),
    [phone, setPhone] = useState(rider.phone),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    nameOk = name.trim().length >= 2,
    phoneOk = /^[6-9]\d{9}$/.test(phone);
  return (
    <Box
      component="form"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (!nameOk || !phoneOk || busy) return;
        setBusy(true);
        const failure = await onSave(rider, { name: name.trim(), phone });
        setBusy(false);
        if (failure) setError(failure);
        else onClose();
      }}
    >
      <DialogTitle>Edit rider</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
        {error && <ToastAlert severity="error">{error}</ToastAlert>}
        <FormField label="Full name" htmlFor="edit-rider-name">
          <CommonTextField
            id="edit-rider-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!nameOk}
            slotProps={{ htmlInput: { maxLength: 150 } }}
          />
        </FormField>
        <FormField label="Mobile number" htmlFor="edit-rider-phone">
          <CommonTextField
            id="edit-rider-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            error={!phoneOk}
            helperText={phoneOk ? undefined : "Enter a valid 10 digit mobile number."}
            slotProps={{
              htmlInput: { maxLength: 10, inputMode: "numeric" },
              input: { startAdornment: prefixAdornment(COUNTRY_CODE) },
            }}
          />
        </FormField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <CommonButton variant="outlined" onClick={onClose} disabled={busy}>
          Cancel
        </CommonButton>
        <CommonButton type="submit" variant="contained" disabled={!nameOk || !phoneOk || busy}>
          {busy ? "Saving…" : "Save"}
        </CommonButton>
      </DialogActions>
    </Box>
  );
}

/** Asks before removing a rider. `onConfirm` resolves to an error message, or "" when removed. */
export function RemoveRiderDialog({
  rider,
  onClose,
  onConfirm,
}: {
  rider?: Rider;
  onClose: () => void;
  onConfirm: (rider: Rider) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog open={!!rider} onClose={busy ? undefined : onClose}>
      <DialogTitle>Remove {rider?.name}?</DialogTitle>
      <DialogContent>
        {error && (
          <ToastAlert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </ToastAlert>
        )}
        <DialogContentText>
          They will no longer be offered for your orders. This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <CommonButton onClick={onClose} disabled={busy}>
          Cancel
        </CommonButton>
        <CommonButton
          color="error"
          variant="contained"
          disabled={busy}
          onClick={async () => {
            if (!rider) return;
            setBusy(true);
            setError("");
            const failure = await onConfirm(rider);
            setBusy(false);
            if (failure) setError(failure);
            else onClose();
          }}
        >
          {busy ? "Removing…" : "Remove rider"}
        </CommonButton>
      </DialogActions>
    </Dialog>
  );
}
