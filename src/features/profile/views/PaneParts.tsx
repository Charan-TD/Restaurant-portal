import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { tokens } from "@/core/theme/tokens";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField } from "@/shared/components/form/FormField";

/** Section title inside a pane, e.g. "Payout account". */
export function SubHeading({
  children,
  note,
}: {
  children: ReactNode;
  note?: string;
}) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{children}</Typography>
      {note && (
        <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
          {note}
        </Typography>
      )}
    </Box>
  );
}

/** A blue information bar. */
export function InfoBar({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.25,
        fontSize: 14,
        borderRadius: tokens.radius.input,
        color: tokens.color.text,
        bgcolor: tokens.color.infoBg,
        border: `1px solid ${tokens.color.info}33`,
      }}
    >
      {children}
    </Box>
  );
}

/** A shown-only value in a normal looking box. */
export function ReadField({ label, value }: { label: string; value?: string }) {
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

/** Small tile with an upper-case caption, a value and a note. */
export function FactTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: tokens.radius.input,
        bgcolor: tokens.color.sunken,
        border: `1px solid ${tokens.color.borderSubtle}`,
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: tokens.color.textMuted,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ mt: 0.25, fontSize: 18, fontWeight: 700 }}>
        {value}
      </Typography>
      {note && (
        <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
          {note}
        </Typography>
      )}
    </Box>
  );
}

/** Cancel and Save across the bottom of a pane. */
export function PaneFooter({ children }: { children: ReactNode }) {
  return (
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
      {children}
    </Box>
  );
}
