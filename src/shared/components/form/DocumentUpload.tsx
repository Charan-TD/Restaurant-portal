"use client";
import { useRef, useState, type ReactNode } from "react";
import { Box, Button, IconButton, Link, Typography } from "@mui/material";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ImageOutlined from "@mui/icons-material/ImageOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import OpenInNewOutlined from "@mui/icons-material/OpenInNewOutlined";
export interface DocumentUploadProps {
  title: string;
  /** What to upload, e.g. "PDF or image, up to 2 MB". */
  hint?: string;
  value: File | null;
  onChange: (file: File | null) => void;
  /** A file already on record; shown with a View link. */
  currentUrl?: string;
  /** Picture uploads show a thumbnail instead of a document icon. */
  image?: boolean;
  required?: boolean;
  accept?: string;
  icon?: ReactNode;
}
const size = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
/**
 * An upload tile: what it is, whether a file is already on record, the file
 * picked now, and one button to choose or replace it (drag and drop works too).
 */
export function DocumentUpload({
  title,
  hint = "PDF, JPG, PNG or WEBP, up to 2 MB",
  value,
  onChange,
  currentUrl,
  image,
  required,
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  icon,
}: DocumentUploadProps) {
  const input = useRef<HTMLInputElement>(null),
    [over, setOver] = useState(false);
  const status = value
    ? `${value.name} · ${size(value.size)}`
    : currentUrl
      ? "On file. Upload a new one to replace it."
      : "Not uploaded yet";
  return (
    <Box
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onChange(file);
      }}
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1.5,
        p: 1.5,
        minWidth: 0,
        border: "1.5px dashed",
        borderColor: over ? "primary.main" : value ? "success.main" : "divider",
        bgcolor: over ? "rgba(242,106,46,.05)" : "background.paper",
        borderRadius: "12px",
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "10px",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          overflow: "hidden",
          bgcolor: "rgba(242,106,46,.08)",
          color: "primary.main",
        }}
      >
        {image && currentUrl && !value ? (
          <Box
            component="img"
            src={currentUrl}
            alt=""
            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          (icon ??
          (image ? <ImageOutlined /> : <DescriptionOutlined />))
        )}
      </Box>
      <Box sx={{ flex: "1 1 160px", minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }}>
          {title}
          {required && <span style={{ color: "#d32f2f" }}> *</span>}
        </Typography>
        <Typography
          variant="body2"
          color={value ? "success.main" : "text.secondary"}
          sx={{ overflowWrap: "anywhere" }}
        >
          {status}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {currentUrl && !value && (
          <Link
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.25,
              mr: 1,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            View <OpenInNewOutlined sx={{ fontSize: 16 }} />
          </Link>
        )}
        <Button
          size="small"
          variant="outlined"
          startIcon={<FileUploadOutlined />}
          onClick={() => input.current?.click()}
        >
          {value || currentUrl ? "Replace" : "Upload"}
        </Button>
        {value && (
          <IconButton
            size="small"
            aria-label={`Remove ${title} file`}
            onClick={() => onChange(null)}
          >
            <CloseOutlined fontSize="small" />
          </IconButton>
        )}
        <input
          ref={input}
          hidden
          type="file"
          aria-label={`Upload ${title}`}
          accept={accept}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onChange(file);
            e.target.value = "";
          }}
        />
      </Box>
    </Box>
  );
}
