"use client";
import { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { Box, ButtonBase, FormHelperText, Typography } from "@mui/material";
import AddPhotoAlternateOutlined from "@mui/icons-material/AddPhotoAlternateOutlined";
import CameraAltOutlined from "@mui/icons-material/CameraAltOutlined";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField, prefixAdornment } from "@/shared/components/form/FormField";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { DEMO_MODE } from "@/core/constants/config";
import type { ProfileViewModel } from "../viewmodels/useProfileViewModel";
import { useChangeRequests } from "../viewmodels/useChangeRequests";
import { DeliveryRidersRequest } from "./DeliveryRidersRequest";
import { PaneHeading } from "./PaneHeading";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"],
  IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const three = {
  display: "grid",
  gap: 2.5,
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
} as const;

const heading = { fontWeight: 700, fontSize: 16, mb: 1.5 } as const;

/** A shown-only value in a normal looking box, as these details change through approval. */
function Locked({ label, value }: { label: string; value?: string }) {
  return (
    <FormField label={label}>
      <CommonTextField
        value={value ?? ""}
        placeholder="Not added"
        slotProps={{
          input: { readOnly: true },
          htmlInput: { "aria-label": label },
        }}
      />
    </FormField>
  );
}

/** Cuisine names as chips; only the first two are shown, with a "+N" for the rest. */
function Cuisines({ names }: { names: string[] }) {
  return (
    <FormField label="Cuisines">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          height: 48,
          px: 1.75,
          borderRadius: tokens.radius.input,
          border: `1.5px solid ${tokens.color.borderInput}`,
          bgcolor: tokens.color.card,
          overflow: "hidden",
        }}
      >
        {names.length ? (
          <>
            {names.slice(0, 2).map((n) => (
              <Box
                key={n}
                component="span"
                sx={{
                  px: 1.25,
                  borderRadius: "999px",
                  fontSize: 13,
                  lineHeight: "26px",
                  whiteSpace: "nowrap",
                  bgcolor: tokens.color.muted,
                }}
              >
                {n}
              </Box>
            ))}
            {names.length > 2 && (
              <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
                +{names.length - 2}
              </Typography>
            )}
          </>
        ) : (
          <Typography sx={{ color: tokens.color.textSubtle }}>
            Not added
          </Typography>
        )}
      </Box>
    </FormField>
  );
}

/** Checks a picture and hands it on, or says what is wrong with it. */
function useImageChoice(onChoose: (file: File) => void) {
  const [error, setError] = useState("");
  return {
    error,
    choose: (file?: File) => {
      if (!file) return;
      if (!IMAGE_TYPES.includes(file.type))
        return setError("Choose a JPG, PNG or WEBP picture.");
      if (file.size > IMAGE_MAX_BYTES)
        return setError("The picture must be 2 MB or smaller.");
      setError("");
      onChoose(file);
    },
  };
}

/** A temporary link for showing a chosen file, released when it changes. */
function usePreview(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);
  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

const hiddenPicker = (onFile: (file?: File) => void) => (
  <input
    hidden
    type="file"
    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
    onChange={(e) => {
      onFile(e.target.files?.[0]);
      e.target.value = "";
    }}
  />
);

/**
 * The Restaurant details section. Only the mobile number, logo and cover save
 * directly; the other details change through approval, so they are shown only.
 */
export function RestaurantDetailsPanel({ vm }: { vm: ProfileViewModel }) {
  const { details } = vm,
    changes = useChangeRequests(),
    locked = !DEMO_MODE,
    logo = useImageChoice(vm.setLogo),
    cover = useImageChoice(vm.setCover),
    logoSrc = usePreview(vm.logo) ?? details?.logoUrl,
    coverSrc = usePreview(vm.cover) ?? details?.coverUrl,
    // The mobile number stays locked until it is clicked; it locks again once
    // it is left unchanged, or its change is saved or cancelled.
    [phoneClicked, setPhoneClicked] = useState(false),
    [phoneFocused, setPhoneFocused] = useState(false),
    phoneOpen =
      phoneClicked &&
      (phoneFocused || !!vm.form.formState.dirtyFields.phone),
    changed = vm.form.formState.isDirty || !!vm.logo || !!vm.cover,
    // The owner's sign-in number, which cannot be edited here.
    ownerDigits = details?.mobile?.replace(/\D/g, "").slice(-10),
    ownerMobile = ownerDigits ? `${COUNTRY_CODE} ${ownerDigits}` : undefined;
  /** The editable phone: the restaurant's number, or the mobile in demo mode. */
  const phoneField = (label: string) => (
    <Controller
      name="phone"
      control={vm.form.control}
      render={({ field, fieldState }) => (
        <FormField label={label} htmlFor="profile-phone">
          <CommonTextField
            {...field}
            id="profile-phone"
            type="tel"
            onClick={() => setPhoneClicked(true)}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => {
              field.onBlur();
              setPhoneFocused(false);
            }}
            error={!!fieldState.error}
            helperText={fieldState.error?.message}
            onChange={(e) =>
              field.onChange(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            slotProps={{
              htmlInput: { inputMode: "numeric", maxLength: 10 },
              input: {
                readOnly: !phoneOpen,
                startAdornment: prefixAdornment(COUNTRY_CODE),
              },
            }}
          />
        </FormField>
      )}
    />
  );
  return (
    <Box component="form" noValidate onSubmit={vm.save}>
      <PaneHeading
        title="Restaurant details"
        subtitle="How passengers and TrainDhaba see your restaurant"
      />
      <Box sx={{ p: 3, display: "grid", gap: 3.5 }}>
        {!DEMO_MODE && (
          <Box>
            <Typography sx={heading}>Logo and cover photo</Typography>
            <Box sx={{ display: "flex", gap: 2.5, alignItems: "stretch" }}>
              <Box sx={{ position: "relative", flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 112,
                    height: 112,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "16px",
                    fontSize: 32,
                    fontWeight: 700,
                    bgcolor: tokens.color.muted,
                    backgroundImage: logoSrc ? `url(${logoSrc})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {!logoSrc && vm.vendor.initials}
                </Box>
                <ButtonBase
                  component="label"
                  aria-label="Change logo"
                  sx={{
                    position: "absolute",
                    right: -6,
                    bottom: -6,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: tokens.color.card,
                    border: `1px solid ${tokens.color.border}`,
                    boxShadow: tokens.shadow.card,
                  }}
                >
                  <CameraAltOutlined sx={{ fontSize: 16 }} />
                  {hiddenPicker(logo.choose)}
                </ButtonBase>
              </Box>
              <ButtonBase
                component="label"
                aria-label={coverSrc ? "Change cover photo" : "Add cover photo"}
                sx={{
                  flex: 1,
                  minHeight: 112,
                  flexDirection: "column",
                  gap: 0.25,
                  borderRadius: "16px",
                  border: `1.5px dashed ${tokens.color.dashed}`,
                  bgcolor: tokens.color.sunken,
                  color: tokens.color.text,
                  overflow: "hidden",
                  backgroundImage: coverSrc ? `url(${coverSrc})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {!coverSrc && (
                  <>
                    <AddPhotoAlternateOutlined
                      sx={{ color: tokens.color.textMuted }}
                    />
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                      Add cover photo
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12, color: tokens.color.textMuted }}
                    >
                      Wide, min 1200 × 600 px
                    </Typography>
                  </>
                )}
                {hiddenPicker(cover.choose)}
              </ButtonBase>
            </Box>
            {(logo.error || cover.error) && (
              <FormHelperText error>{logo.error || cover.error}</FormHelperText>
            )}
          </Box>
        )}
        <Box>
          <Typography sx={heading}>Basic details</Typography>
          <Box sx={three}>
            <Controller
              name="restaurantName"
              control={vm.form.control}
              render={({ field, fieldState }) => (
                <FormField label="Restaurant name" htmlFor="profile-restaurant">
                  <CommonTextField
                    {...field}
                    id="profile-restaurant"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{ input: { readOnly: locked } }}
                  />
                </FormField>
              )}
            />
            <Controller
              name="name"
              control={vm.form.control}
              render={({ field, fieldState }) => (
                <FormField label="Owner name" htmlFor="profile-owner">
                  <CommonTextField
                    {...field}
                    id="profile-owner"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    slotProps={{ input: { readOnly: locked } }}
                  />
                </FormField>
              )}
            />
            {DEMO_MODE ? (
              phoneField("Mobile")
            ) : (
              <Locked label="Mobile" value={ownerMobile} />
            )}
            <Locked label="Email" value={vm.email} />
            <Locked label="Restaurant type" value={details?.type} />
            <Cuisines names={details?.cuisines ?? []} />
          </Box>
          {!DEMO_MODE && (
            <Box sx={{ mt: 2.5 }}>
              {phoneField("Restaurant phone · for customers & riders")}
            </Box>
          )}
          {DEMO_MODE && (
            <Box sx={{ mt: 2.5 }}>
              <Controller
                name="city"
                control={vm.form.control}
                render={({ field }) => (
                  <FormField label="City" htmlFor="profile-city">
                    <CommonTextField {...field} id="profile-city" />
                  </FormField>
                )}
              />
            </Box>
          )}
          {!DEMO_MODE && (
            <Typography
              sx={{ mt: 1.5, fontSize: 12, color: tokens.color.textSubtle }}
            >
              You can change the restaurant phone, logo and cover here. Other
              details need approval, see Business documents and Restaurant
              location.
            </Typography>
          )}
        </Box>
        {!DEMO_MODE && (
          <Box>
            <Typography sx={{ ...heading, mb: 0 }}>
              Delivery to the train
            </Typography>
            <Typography
              sx={{ mb: 1.5, fontSize: 14, color: tokens.color.textMuted }}
            >
              Who takes the food from your outlet to the passenger&apos;s coach?
            </Typography>
            <DeliveryRidersRequest
              requests={changes.requests}
              onSent={changes.reload}
            />
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
          px: 3,
          py: 2,
          borderTop: `1px solid ${tokens.color.borderSubtle}`,
        }}
      >
        <CommonButton variant="text" disabled={!changed} onClick={vm.cancel}>
          Cancel
        </CommonButton>
        <CommonButton
          type="submit"
          variant="contained"
          disabled={!changed || vm.busy}
        >
          {vm.busy ? "Saving…" : "Save changes"}
        </CommonButton>
      </Box>
    </Box>
  );
}
