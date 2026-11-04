"use client";
import { useEffect, useMemo, useState } from "react";
import { Box, ButtonBase, FormHelperText, Typography } from "@mui/material";
import CameraAltOutlined from "@mui/icons-material/CameraAltOutlined";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { ToastAlert, useToast } from "@/core/providers/ToastProvider";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField, prefixAdornment } from "@/shared/components/form/FormField";
import { cardSx, cardHeaderSx, tokens } from "@/core/theme/tokens";
import { PHOTO_MAX_BYTES, PHOTO_TYPES, type RiderForm } from "../models/rider";

/** The Add rider card beside the rider list: photo, name and mobile number. */
export function AddRiderPanel({
  saving,
  onAdd,
}: {
  saving: boolean;
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
    nameOk = name.trim().length >= 2,
    phoneOk = /^[6-9]\d{9}$/.test(phone);
  // The chosen picture is previewed from a temporary link, released afterwards.
  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);
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
    setSaveError("");
    if (!nameOk || !phoneOk || saving) return;
    const failure = await onAdd({ name: name.trim(), phone, photo });
    if (failure) return setSaveError(failure);
    toast.success("Rider added.");
    setName("");
    setPhone("");
    setPhoto(undefined);
  }
  return (
    <Box
      component="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      sx={{ ...cardSx, overflow: "hidden" }}
    >
      <Box sx={cardHeaderSx}>
        <Typography className="title">Add rider</Typography>
        <Typography className="subtitle">
          Passengers see the photo and name at handover
        </Typography>
      </Box>
      <Box sx={{ p: 3, display: "grid", gap: 2.5 }}>
        {saveError && <ToastAlert severity="error">{saveError}</ToastAlert>}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <ButtonBase
            component="label"
            aria-label={photo ? "Change photo" : "Upload photo"}
            sx={{
              width: 80,
              height: 80,
              flexShrink: 0,
              borderRadius: "50%",
              border: "1.5px dashed",
              borderColor: tokens.color.dashed,
              color: tokens.color.textMuted,
              overflow: "hidden",
              bgcolor: tokens.color.sunken,
              backgroundImage: preview ? `url(${preview})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!preview && <CameraAltOutlined />}
            <input
              hidden
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={(e) => {
                choosePhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </ButtonBase>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
              Profile photo
            </Typography>
            <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
              Clear face photo · take or upload
            </Typography>
            {photoError && <FormHelperText error>{photoError}</FormHelperText>}
            {photo && (
              <Box>
                <CommonButton
                  size="small"
                  color="inherit"
                  onClick={() => setPhoto(undefined)}
                >
                  Remove photo
                </CommonButton>
              </Box>
            )}
          </Box>
        </Box>
        <FormField label="Full name" htmlFor="rider-name">
          <CommonTextField
            id="rider-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ravi Kumar"
            slotProps={{ htmlInput: { maxLength: 60 } }}
          />
        </FormField>
        <FormField label="Mobile number" htmlFor="rider-phone">
          <CommonTextField
            id="rider-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit mobile"
            slotProps={{
              htmlInput: { maxLength: 10, inputMode: "numeric" },
              input: { startAdornment: prefixAdornment(COUNTRY_CODE) },
            }}
          />
        </FormField>
      </Box>
      <Box sx={{ px: 3, pb: 3, display: "grid", gap: 1, justifyItems: "center" }}>
        <CommonButton
          type="submit"
          variant="contained"
          fullWidth
          disabled={!nameOk || !phoneOk || saving}
        >
          {saving ? "Adding…" : "Add rider"}
        </CommonButton>
        {!phoneOk && (
          <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
            Add a 10-digit mobile number to continue
          </Typography>
        )}
      </Box>
    </Box>
  );
}
