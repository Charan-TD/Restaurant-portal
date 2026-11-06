import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
/** Bold label above a field, with a red star when required. */
export function FieldLabel({
  text,
  required,
  htmlFor,
  note,
}: {
  text: string;
  required?: boolean;
  htmlFor?: string;
  /** A muted line after the label. */
  note?: string;
}) {
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      sx={{ display: "block", fontWeight: 600, fontSize: 14, mb: 0.75 }}
    >
      {text}
      {required && <span style={{ color: "#d32f2f" }}> *</span>}
      {note && (
        <span style={{ fontWeight: 400, color: "#6b7280" }}> · {note}</span>
      )}
    </Typography>
  );
}
/** A label above its input; the input itself should have no floating label. */
export function FormField({
  label,
  required,
  htmlFor,
  note,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <FieldLabel text={label} required={required} htmlFor={htmlFor} note={note} />
      {children}
    </Box>
  );
}
/** Two columns on wide screens, one on phones; every form uses the same gaps. */
export function FormGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 2.5, md: "24px 28px" },
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        alignItems: "start",
      }}
    >
      {children}
    </Box>
  );
}
/** A grey box before the input text, e.g. "+91" or "₹", always visible. */
export function prefixAdornment(text: string) {
  return (
    <Box
      sx={{
        alignSelf: "stretch",
        display: "flex",
        alignItems: "center",
        px: 1.5,
        mr: 1.5,
        ml: -1.75,
        bgcolor: "#f3f4f2",
        borderRight: 1,
        borderColor: "divider",
        borderRadius: "10px 0 0 10px",
        color: "text.secondary",
      }}
    >
      {text}
    </Box>
  );
}
