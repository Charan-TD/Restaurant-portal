"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  IconButton,
  Typography,
} from "@mui/material";
import CameraAltOutlined from "@mui/icons-material/CameraAltOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { ToastAlert, useToast } from "@/core/providers/ToastProvider";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField, prefixAdornment } from "@/shared/components/form/FormField";
import { PHOTO_MAX_BYTES, PHOTO_TYPES, type RiderForm } from "../models/rider";
/** A pop up for a rider's profile photo, name and phone number. */
export function AddRiderDialog({
  open,
  saving,
  onClose,
  onAdd,
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  /** Resolves to an error message, or "" once the rider is saved. */
  onAdd: (rider: RiderForm) => Promise<string>;
}) {
  const toast = useToast(),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [photo, setPhoto] = useState<File>(),
    preview = useMemo(
      () => (photo ? URL.createObjectURL(photo) : undefined),
      [photo],
    ),
    [saveError, setSaveError] = useState(""),
    [photoError, setPhotoError] = useState(""),
    [submitted, setSubmitted] = useState(false),
    nameError = name.trim().length < 2 ? "Enter the rider's full name." : "",
    phoneError = !/^[6-9]\d{9}$/.test(phone)
      ? "Enter a valid 10 digit mobile number."
      : "";
  // The chosen picture is previewed from a temporary link, released afterwards.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);
  function close() {
    onClose();
    setName("");
    setPhone("");
    setPhoto(undefined);
    setPhotoError("");
    setSubmitted(false);
    setSaveError("");
  }
  function choosePhoto(file?: File) {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type))
      return setPhotoError("Choose a JPG, PNG or WEBP picture.");
    if (file.size > PHOTO_MAX_BYTES)
      return setPhotoError("The picture must be 2 MB or smaller.");
    setPhotoError("");
    setPhoto(file);
  }
  async function submit() {
    setSubmitted(true);
    setSaveError("");
    if (nameError || phoneError) return;
    const failure = await onAdd({ name: name.trim(), phone, photo });
    if (failure) return setSaveError(failure);
    toast.success("Rider added.");
    close();
  }
  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <Box
        component="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 800,
          }}
        >
          Add rider
          <IconButton aria-label="Close" onClick={close} edge="end">
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2.5, pt: 1 }}>
          {saveError && <ToastAlert severity="error">{saveError}</ToastAlert>}
          <Box sx={{ display: "grid", justifyItems: "center", gap: 0.75 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                <IconButton
                  component="label"
                  aria-label={photo ? "Change photo" : "Upload photo"}
                  sx={{
                    bgcolor: "primary.main",
                    color: "common.white",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                  size="small"
                >
                  <CameraAltOutlined fontSize="small" />
                  <input
                    hidden
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      choosePhoto(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </IconButton>
              }
            >
              <Avatar src={preview} sx={{ width: 104, height: 104 }}>
                <PersonOutlined sx={{ fontSize: 52 }} />
              </Avatar>
            </Badge>
            <Typography variant="caption" color="text.secondary">
              Profile photo · JPG, PNG or WEBP, up to 2 MB
            </Typography>
            {photoError && <FormHelperText error>{photoError}</FormHelperText>}
            {photo && (
              <CommonButton
                size="small"
                color="inherit"
                onClick={() => setPhoto(undefined)}
              >
                Remove photo
              </CommonButton>
            )}
          </Box>
          <FormField label="Rider name" required htmlFor="rider-name">
            <CommonTextField
              id="rider-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ravi Kumar"
              error={submitted && !!nameError}
              helperText={submitted ? nameError : undefined}
              slotProps={{ htmlInput: { maxLength: 60 } }}
            />
          </FormField>
          <FormField label="Mobile number" required htmlFor="rider-phone">
            <CommonTextField
              id="rider-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="10 digit mobile number"
              error={submitted && !!phoneError}
              helperText={submitted ? phoneError : undefined}
              slotProps={{
                htmlInput: { maxLength: 10, inputMode: "numeric" },
                input: { startAdornment: prefixAdornment(COUNTRY_CODE) },
              }}
            />
          </FormField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <CommonButton variant="outlined" disabled={saving} onClick={close}>
            Cancel
          </CommonButton>
          <CommonButton type="submit" variant="contained" disabled={saving}>
            {saving ? "Adding…" : "Add rider"}
          </CommonButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
