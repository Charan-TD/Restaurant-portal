"use client";
import type { ReactNode } from "react";
import { Controller, useFormContext, useWatch, type FieldPath } from "react-hook-form";
import { Box, ButtonBase, FormHelperText, Typography } from "@mui/material";
import CameraAltOutlined from "@mui/icons-material/CameraAltOutlined";
import InsertPhotoOutlined from "@mui/icons-material/InsertPhotoOutlined";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlined from "@mui/icons-material/InsertDriveFileOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import { tokens } from "@/core/theme/tokens";
import type { RegistrationForm } from "../models/registration";
import {
  usePreview,
  useSavedFiles,
  type SavedFile,
} from "../services/registrationExtras";

/** The saved-file name of each upload field. */
const savedAs: Record<string, SavedFile> = {
  logo: "logo",
  coverPhoto: "cover",
  "documents.gst": "gst",
  "documents.pan": "pan",
  "documents.fssai": "fssai",
  "documents.identity": "identity",
  "documents.businessProof": "businessProof",
  bankProof: "bankProof",
};

type Accept = "picture" | "document";
type Variant = "drop" | "row" | "cover" | "logo";

const accepts: Record<Accept, { input: string; hint: string }> = {
  picture: {
    input: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
    hint: "JPG, PNG or WEBP, up to 2 MB",
  },
  document: {
    input:
      ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp",
    hint: "PDF, JPG, PNG or WEBP, up to 2 MB",
  },
};

interface Props {
  name: FieldPath<RegistrationForm>;
  label: string;
  accept?: Accept;
  /** How it looks: a drop box, a row with a button, the wide cover box or the logo tile. */
  variant?: Variant;
  /** Replaces the default format hint. */
  hint?: string;
  /** A second line in the "row" variant. */
  note?: string;
}

const size = (file: File) =>
  file.size >= 1024 * 1024
    ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(file.size / 1024))} KB`;

/** A file field of the registration form, picked with a hidden input. */
export function RegistrationUpload({
  name,
  label,
  accept = "document",
  variant = "drop",
  hint,
  note,
}: Props) {
  const { control } = useFormContext<RegistrationForm>(),
    restaurant = useWatch({ control, name: "restaurantName" }),
    // "Kitchen Bowl" → KB; a photo icon until a name is typed
    initial =
      (restaurant ?? "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join(""),
    saved = !!useSavedFiles()[savedAs[name]],
    logoPreview = usePreview("logo"),
    coverPreview = usePreview("cover");
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const file =
            typeof File !== "undefined" && field.value instanceof File
              ? field.value
              : null,
          error = fieldState.error?.message,
          input = (
            <input
              hidden
              type="file"
              aria-label={label}
              accept={accepts[accept].input}
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) {
                  field.onChange(picked);
                  // Check the file now, so a wrong type or size shows at once.
                  field.onBlur();
                }
                e.target.value = "";
              }}
            />
          ),
          errorText = error && <FormHelperText error>{error}</FormHelperText>;
        let body: ReactNode;
        if (variant === "logo")
          body = (
            <Box sx={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "16px",
                  fontSize: 28,
                  fontWeight: 800,
                  bgcolor: tokens.color.muted,
                  border: `1.5px solid ${error ? tokens.color.error : "transparent"}`,
                }}
              >
                {file || logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={file ? URL.createObjectURL(file) : logoPreview}
                    alt="Logo preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : initial ? (
                  initial
                ) : (
                  <InsertPhotoOutlined sx={{ fontSize: 44, color: tokens.color.textSubtle }} />
                )}
              </Box>
              <ButtonBase
                component="label"
                aria-label={`${label}: choose a picture`}
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
                {input}
              </ButtonBase>
            </Box>
          );
        else if (variant === "row")
          body = (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.5,
                borderRadius: "12px",
                bgcolor: tokens.color.card,
                border: `1.5px dashed ${error ? tokens.color.error : tokens.color.dashed}`,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "10px",
                  color: tokens.color.textMuted,
                  bgcolor: tokens.color.muted,
                }}
              >
                <InsertDriveFileOutlined fontSize="small" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
                  {file ? file.name : label}
                </Typography>
                <Typography noWrap sx={{ fontSize: 12, color: tokens.color.textMuted }}>
                  {file
                    ? `${size(file)} · ready to send`
                    : saved
                      ? "Uploaded earlier · saved"
                      : (note ?? hint ?? accepts[accept].hint)}
                </Typography>
              </Box>
              <ButtonBase
                component="label"
                sx={{
                  gap: 0.75,
                  height: 36,
                  px: 1.5,
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: "10px",
                  color: tokens.color.primary,
                  border: `1px solid ${tokens.color.primarySubtleBorder}`,
                }}
              >
                <FileUploadOutlined sx={{ fontSize: 18 }} />
                {file || saved ? "Replace" : "Upload"}
                {input}
              </ButtonBase>
            </Box>
          );
        else
          body = (
            <ButtonBase
              component="label"
              sx={{
                width: "100%",
                minHeight: variant === "cover" ? 120 : 104,
                flexDirection: "column",
                gap: 0.5,
                px: 2,
                py: 1.5,
                textAlign: "center",
                borderRadius: "12px",
                bgcolor: variant === "cover" ? tokens.color.sunken : tokens.color.card,
                border: `1.5px dashed ${error ? tokens.color.error : tokens.color.dashed}`,
                ...(variant === "cover" && (file || coverPreview)
                  ? {
                      backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(${file ? URL.createObjectURL(file) : coverPreview})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      color: "#fff",
                      "& .MuiTypography-root, & .MuiSvgIcon-root": { color: "#fff" },
                    }
                  : {}),
              }}
            >
              {variant === "cover" ? (
                <ImageOutlined sx={{ color: tokens.color.textMuted }} />
              ) : (
                <FileUploadOutlined sx={{ color: tokens.color.textMuted }} />
              )}
              <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                {file ? file.name : saved ? `${label.replace(/^Upload /, "")} uploaded` : label}
              </Typography>
              <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
                {file
                  ? `${size(file)} · click to replace`
                  : saved
                    ? "Saved earlier · click to replace"
                    : (hint ?? accepts[accept].hint)}
              </Typography>
              {input}
            </ButtonBase>
          );
        return (
          <Box sx={{ minWidth: 0, flex: variant === "cover" ? 1 : undefined }}>
            {body}
            {errorText}
          </Box>
        );
      }}
    />
  );
}
