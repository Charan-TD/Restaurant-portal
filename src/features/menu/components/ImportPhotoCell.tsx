"use client";
import { useEffect, useState } from "react";
import { Box, ButtonBase } from "@mui/material";
import { tokens } from "@/core/theme/tokens";

/** A small preview of a dish's picture; nothing while it has none. */
export function PhotoThumb({ file, size = 40 }: { file: File | null; size?: number }) {
  // The URL is keyed to the file it was made for, so a replaced or removed file never shows a stale picture.
  const [made, setMade] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => {
    if (!file) return;
    // Pictures are resized to a small JPEG, so a data URL is cheap and needs no clean-up.
    let live = true;
    const reader = new FileReader();
    reader.onload = () => live && setMade({ file, url: String(reader.result) });
    reader.readAsDataURL(file);
    return () => {
      live = false;
    };
  }, [file]);
  if (!file || made?.file !== file) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={made.url} alt="" width={size} height={size} style={{ objectFit: "cover", borderRadius: 8, border: `1px solid ${tokens.color.border}` }} />
  );
}

/** The photo column: preview, and Add photo / Change / Remove. */
export function ImportPhotoCell({
  file,
  name,
  missing,
  onPick,
  onRemove,
}: {
  file: File | null;
  name: string;
  missing: boolean;
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  const link = { fontSize: 12, fontWeight: 700, color: tokens.color.primary };
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 130 }}>
      <PhotoThumb file={file} />
      <Box sx={{ display: "grid", justifyItems: "start" }}>
        <ButtonBase component="label" sx={{ ...link, px: 1, py: 0.5, borderRadius: 99, border: `1px solid ${missing ? tokens.color.error : tokens.color.primarySubtleBorder}`, color: missing ? tokens.color.error : tokens.color.primary }}>
          {file ? "Change" : "Add photo"}
          <input
            hidden
            type="file"
            accept="image/*"
            aria-label={`Photo for ${name || "dish"}`}
            onChange={(e) => {
              onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </ButtonBase>
        {file && (
          <ButtonBase onClick={onRemove} sx={{ ...link, color: tokens.color.textMuted, mt: 0.25 }}>
            Remove
          </ButtonBase>
        )}
        {missing && !file && (
          <Box component="span" sx={{ fontSize: 11, color: tokens.color.error, mt: 0.25 }}>Required</Box>
        )}
      </Box>
    </Box>
  );
}
