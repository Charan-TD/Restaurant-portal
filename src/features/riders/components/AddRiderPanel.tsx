"use client";
import { useEffect, useState } from "react";
import { Box, ButtonBase, FormHelperText, Typography } from "@mui/material";
import CameraAltOutlined from "@mui/icons-material/CameraAltOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { ToastAlert, useToast } from "@/core/providers/ToastProvider";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonSelect } from "@/shared/components/form/CommonSelect";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField, prefixAdornment } from "@/shared/components/form/FormField";
import { cardSx, cardHeaderSx, tokens } from "@/core/theme/tokens";
import {
  DOC_TYPES,
  GENDERS,
  PHOTO_MAX_BYTES,
  PHOTO_TYPES,
  VEHICLE_TYPES,
  docProblem,
  riderProblems,
  type RiderForm,
} from "../models/rider";

type DocKey = "aadhaar" | "license" | "rc" | "pan";
/** The documents the API takes, in the order the design lists them. */
const DOCS: {
  key: DocKey;
  title: string;
  hint: string;
  required: boolean;
  numberLabel: string;
  numberPlaceholder: string;
}[] = [
  { key: "aadhaar", title: "Aadhaar card", hint: "Front and back in one file", required: true, numberLabel: "Aadhaar number", numberPlaceholder: "12-digit Aadhaar" },
  { key: "license", title: "Driving licence", hint: "Must be valid", required: true, numberLabel: "Licence number", numberPlaceholder: "Licence number" },
  { key: "rc", title: "Vehicle RC", hint: "RC book or card", required: true, numberLabel: "RC number", numberPlaceholder: "RC number" },
  { key: "pan", title: "PAN card", hint: "Optional", required: false, numberLabel: "PAN number", numberPlaceholder: "ABCDE1234F" },
];
const accept = ".jpg,.jpeg,.png,.pdf," + DOC_TYPES.join(",");

/** One document row: Upload, or the file name with Added and a remove button. */
function DocRow({
  title,
  hint,
  file,
  error,
  onPick,
  onClear,
}: {
  title: string;
  hint: string;
  file?: File;
  error?: string;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.input,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: 1,
            bgcolor: file ? "#e6f4ea" : tokens.color.sunken,
            color: file ? "#1a7f37" : tokens.color.textMuted,
          }}
        >
          <DescriptionOutlined fontSize="small" />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{title}</Typography>
          <Typography
            noWrap
            sx={{ fontSize: 12, color: tokens.color.textMuted }}
          >
            {file ? file.name : hint}
          </Typography>
        </Box>
        {file ? (
          <>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#1a7f37" }}>
              ✓ Added
            </Typography>
            <ButtonBase aria-label={`Remove ${title}`} onClick={onClear}>
              <CloseOutlined fontSize="small" />
            </ButtonBase>
          </>
        ) : (
          <CommonButton
            component="label"
            size="small"
            variant="outlined"
            startIcon={<FileUploadOutlined />}
          >
            Upload
            <input
              hidden
              type="file"
              accept={accept}
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) onPick(picked);
                e.target.value = "";
              }}
            />
          </CommonButton>
        )}
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}

/** The Add rider card beside the rider list: photo, contact, vehicle and documents. */
export function AddRiderPanel({
  saving,
  onAdd,
}: {
  saving: boolean;
  /** Resolves to an error message, or "" once the rider is saved. */
  onAdd: (rider: RiderForm) => Promise<string>;
}) {
  const toast = useToast(),
    empty = {
      name: "",
      phone: "",
      email: "",
      dob: "",
      gender: "",
      vehicleType: "",
      vehicleNumber: "",
      numbers: { aadhaar: "", license: "", rc: "", pan: "" } as Record<DocKey, string>,
    },
    [form, setForm] = useState(empty),
    [photo, setPhoto] = useState<File>(),
    [files, setFiles] = useState<Partial<Record<DocKey, File>>>({}),
    [docErrors, setDocErrors] = useState<Partial<Record<DocKey, string>>>({}),
    [preview, setPreview] = useState<string>(),
    [saveError, setSaveError] = useState(""),
    [photoError, setPhotoError] = useState(""),
    [submitted, setSubmitted] = useState(false),
    set = <K extends keyof typeof empty>(key: K, value: (typeof empty)[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    setNumber = (key: DocKey, value: string) =>
      setForm((f) => ({ ...f, numbers: { ...f.numbers, [key]: value } })),
    payload = (): RiderForm => ({
      name: form.name.trim(),
      phone: form.phone,
      photo,
      email: form.email,
      dob: form.dob,
      gender: form.gender,
      vehicleType: form.vehicleType,
      vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
      aadhaarNumber: form.numbers.aadhaar,
      panNumber: form.numbers.pan.toUpperCase(),
      licenseNumber: form.numbers.license.trim(),
      rcNumber: form.numbers.rc.trim(),
      aadhaarFile: files.aadhaar,
      panFile: files.pan,
      licenseFile: files.license,
      rcFile: files.rc,
    }),
    problems = riderProblems(payload()),
    // The design asks for the mobile number and every required document.
    missing = DOCS.some(
      (d) => d.required && (!files[d.key] || !form.numbers[d.key].trim()),
    ),
    ready = !Object.keys(problems).length && !missing;
  // The chosen picture is previewed from a temporary link, released afterwards.
  useEffect(() => {
    if (!photo) {
      queueMicrotask(() => setPreview(undefined));
      return;
    }
    const url = URL.createObjectURL(photo);
    queueMicrotask(() => setPreview(url));
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  function choosePhoto(file?: File) {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type))
      return setPhotoError("Choose a JPG, PNG or WEBP picture.");
    if (file.size > PHOTO_MAX_BYTES)
      return setPhotoError("The picture must be 2 MB or smaller.");
    setPhotoError("");
    setPhoto(file);
  }
  function chooseDoc(key: DocKey, file: File) {
    const problem = docProblem(file);
    setDocErrors((e) => ({ ...e, [key]: problem }));
    if (!problem) setFiles((f) => ({ ...f, [key]: file }));
  }
  async function submit() {
    setSaveError("");
    setSubmitted(true);
    if (!ready || saving) return;
    const failure = await onAdd(payload());
    if (failure) return setSaveError(failure);
    toast.success("Rider added.");
    setForm(empty);
    setPhoto(undefined);
    setFiles({});
    setDocErrors({});
    setSubmitted(false);
  }
  const err = (key: string) => (submitted ? problems[key] : undefined);
  return (
    <Box
      component="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      sx={{ ...cardSx, overflow: "hidden", minWidth: 0 }}
    >
      <Box sx={cardHeaderSx}>
        <Typography className="title">Add rider</Typography>
        <Typography className="subtitle">
          Passengers see the photo and name at handover
        </Typography>
      </Box>
      <Box sx={{ p: 3, display: "grid", gap: 2.5, gridTemplateColumns: "minmax(0, 1fr)" }}>
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
              backgroundImage: preview ? "url(" + preview + ")" : undefined,
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
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Full name"
            error={!!err("name")}
            helperText={err("name")}
            slotProps={{ htmlInput: { maxLength: 150 } }}
          />
        </FormField>
        <FormField label="Mobile number" htmlFor="rider-phone">
          <CommonTextField
            id="rider-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))}
            placeholder="10-digit mobile"
            error={!!err("phone")}
            slotProps={{
              htmlInput: { maxLength: 10, inputMode: "numeric" },
              input: { startAdornment: prefixAdornment(COUNTRY_CODE) },
            }}
          />
          <FormHelperText sx={{ mx: 0 }} error={!!err("phone")}>
            {err("phone") ?? "We send an OTP to this number to verify the rider."}
          </FormHelperText>
        </FormField>
        <FormField label="Email (optional)" htmlFor="rider-email">
          <CommonTextField
            id="rider-email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="rider@example.com"
            error={!!err("email")}
            helperText={err("email")}
          />
        </FormField>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
          <FormField label="Date of birth" htmlFor="rider-dob">
            <CommonTextField
              id="rider-dob"
              type="date"
              value={form.dob}
              onChange={(e) => set("dob", e.target.value)}
              slotProps={{
                htmlInput: { max: new Date().toISOString().slice(0, 10) },
              }}
            />
          </FormField>
          <FormField label="Gender" htmlFor="rider-gender">
            <CommonSelect
              id="rider-gender"
              value={form.gender}
              options={GENDERS}
              onChange={(e) => set("gender", e.target.value)}
            />
          </FormField>
          <FormField label="Vehicle type" htmlFor="rider-vehicle-type">
            <CommonSelect
              id="rider-vehicle-type"
              value={form.vehicleType}
              options={VEHICLE_TYPES}
              onChange={(e) => set("vehicleType", e.target.value)}
            />
          </FormField>
          <FormField label="Vehicle number" htmlFor="rider-vehicle-number">
            <CommonTextField
              id="rider-vehicle-number"
              value={form.vehicleNumber}
              onChange={(e) => set("vehicleNumber", e.target.value)}
              placeholder="AP00AB1234"
              slotProps={{ htmlInput: { maxLength: 20 } }}
            />
          </FormField>
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Documents</Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
            JPG, PNG or PDF · up to 5 MB each
          </Typography>
        </Box>
        {DOCS.map((d) => (
          <Box key={d.key} sx={{ display: "grid", gap: 1, gridTemplateColumns: "minmax(0, 1fr)" }}>
            <DocRow
              title={d.title}
              hint={d.hint}
              file={files[d.key]}
              error={docErrors[d.key]}
              onPick={(f) => chooseDoc(d.key, f)}
              onClear={() =>
                setFiles((f) => {
                  const rest = { ...f };
                  delete rest[d.key];
                  return rest;
                })
              }
            />
            <CommonTextField
              size="small"
              value={form.numbers[d.key]}
              onChange={(e) =>
                setNumber(
                  d.key,
                  d.key === "aadhaar"
                    ? e.target.value.replace(/\D/g, "").slice(0, 12)
                    : e.target.value,
                )
              }
              placeholder={d.numberPlaceholder}
              error={!!err(d.key + "Number")}
              helperText={err(d.key + "Number")}
              slotProps={{
                htmlInput: { "aria-label": d.numberLabel, maxLength: 30 },
              }}
            />
          </Box>
        ))}
      </Box>
      <Box sx={{ px: 3, pb: 3, display: "grid", gap: 1, justifyItems: "center" }}>
        <CommonButton
          type="submit"
          variant="contained"
          fullWidth
          disabled={!ready || saving}
        >
          {saving ? "Adding…" : "Add rider"}
        </CommonButton>
        {!ready && (
          <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
            Add mobile number and all documents to continue
          </Typography>
        )}
      </Box>
    </Box>
  );
}
