"use client";
import { useState, type ReactNode } from "react";
import { Box, ClickAwayListener, Tooltip, Typography } from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
/** Bold label above a field, with a red star when required. */
export function FieldLabel({
  text,
  required,
  htmlFor,
  note,
  info,
}: {
  text: string;
  required?: boolean;
  htmlFor?: string;
  /** A muted line after the label. */
  note?: string;
  /** Help shown from an "i" icon beside the label, on hover or tap. */
  info?: ReactNode;
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
      {info && <InfoTip text={info} />}
    </Typography>
  );
}
/** A label above its input; the input itself should have no floating label. */
export function FormField({
  label,
  required,
  htmlFor,
  note,
  info,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  note?: string;
  info?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <FieldLabel text={label} required={required} htmlFor={htmlFor} note={note} info={info} />
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
/** A small "i" beside a label; the help shows only when it is clicked or tapped. */
function InfoTip({ text }: { text: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Tooltip
        open={open}
        title={text}
        arrow={false}
        slotProps={{
          tooltip: {
            sx: {
              bgcolor: "#fff",
              color: "text.primary",
              p: 2,
              maxWidth: 280,
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              fontSize: 14,
              fontWeight: 400,
              lineHeight: 1.7,
            },
          },
        }}
        placement="top-start"
        disableHoverListener
        disableFocusListener
        disableTouchListener
      >
        <InfoOutlined
          role="button"
          tabIndex={0}
          aria-label="Show help"
          aria-expanded={open}
          onClick={(e) => {
            // The icon sits inside the field's <label>: without this the click is
            // passed on to the input, which counts as a click away and closes it.
            e.preventDefault();
            setOpen((v) => !v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen((v) => !v);
            }
            if (e.key === "Escape") setOpen(false);
          }}
          sx={{ ml: 0.75, fontSize: 15, verticalAlign: "-2px", color: "#6b7280", cursor: "pointer" }}
        />
      </Tooltip>
    </ClickAwayListener>
  );
}
