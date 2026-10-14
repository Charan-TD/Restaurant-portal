"use client";
import { Box, Link, Typography } from "@mui/material";
import AttachFileOutlined from "@mui/icons-material/AttachFileOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
export interface UploadLinkProps {
  /** What is being uploaded, used for screen readers, e.g. "PAN card". */
  label: string;
  value: File | null;
  onChange: (file: File | null) => void;
  /** File types the picker offers; defaults to PDF and images. */
  accept?: string;
}
/** A compact "Upload here" link in place of a full upload box. */
export function UploadLink({
  label,
  value,
  onChange,
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
}: UploadLinkProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        minHeight: 40,
        minWidth: 0,
      }}
    >
      <AttachFileOutlined fontSize="small" color="action" />
      {value ? (
        <>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {value.name}
          </Typography>
          <Link
            component="button"
            type="button"
            underline="hover"
            aria-label={`Remove ${label} file`}
            onClick={() => onChange(null)}
            sx={{ display: "inline-flex", color: "text.secondary" }}
          >
            <CloseOutlined sx={{ fontSize: 18 }} />
          </Link>
        </>
      ) : (
        <Link
          component="label"
          underline="always"
          sx={{ cursor: "pointer", fontWeight: 600, fontSize: 14 }}
        >
          Upload here
          <input
            hidden
            aria-label={`Upload ${label}`}
            type="file"
            accept={accept}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onChange(file);
              event.target.value = "";
            }}
          />
        </Link>
      )}
    </Box>
  );
}
