"use client";
import { Typography, FormHelperText } from "@mui/material";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import { CommonButton } from "../actions/CommonButton";
export interface CommonUploadProps {
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  optional?: boolean;
  /** "document" accepts PDF only; "image" accepts JPG/PNG only. */
  accept?: "image" | "document";
  errorMessage?: string;
}
const acceptTypes = {
  image: { input: ".jpg,.jpeg,.png", hint: "JPG or PNG, up to 2 MB" },
  document: { input: ".pdf,application/pdf", hint: "PDF only, up to 2 MB" },
};
export function CommonUpload({
  label,
  value,
  onChange,
  optional = false,
  accept = "document",
  errorMessage,
}: CommonUploadProps) {
  return (
    <div className="upload">
      <Typography variant="subtitle2">
        {label}
        {optional ? "" : " *"}
      </Typography>
      <CommonButton
        component="label"
        variant="outlined"
        startIcon={<UploadFileOutlined />}
      >
        {value?.name || "Choose file"}
        <input
          hidden
          aria-label={label}
          type="file"
          accept={acceptTypes[accept].input}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onChange(file);
            event.target.value = "";
          }}
        />
      </CommonButton>
      <Typography variant="caption" color="text.secondary">
        {acceptTypes[accept].hint}
      </Typography>
      {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
    </div>
  );
}
