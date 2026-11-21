"use client";
import { useState } from "react";
import {
  Box,
  ButtonBase,
  Dialog,
  IconButton,
  InputBase,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { tokens } from "@/core/theme/tokens";

export const NOT_DELIVERED_REASONS = [
  "Passenger not at seat",
  "Passenger cancelled the order",
  "Train left before handover",
  "Passenger refused the food",
  "Wrong coach or seat details",
  "Other",
] as const;

/** Asks why an order was not delivered; the choice (and an optional note) go with the status. */
export function NotDeliveredDialog({
  open,
  subtitle,
  busy,
  onClose,
  onSubmit,
}: {
  open: boolean;
  /** e.g. "Order #48212 · Priya N · B3 14, 15". */
  subtitle: string;
  busy?: boolean;
  onClose: () => void;
  /** The reason, with the note after a dash when one was typed. */
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState<string>(NOT_DELIVERED_REASONS[0]),
    [note, setNote] = useState("");
  const close = () => {
    setReason(NOT_DELIVERED_REASONS[0]);
    setNote("");
    onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : close}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: "16px", p: 2.5 } } }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box>
          <Typography component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>
            Why was it not delivered?
          </Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>{subtitle}</Typography>
        </Box>
        <IconButton aria-label="Close" onClick={close} disabled={busy} size="small">
          <CloseRounded />
        </IconButton>
      </Box>
      <RadioGroup
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        sx={{ mt: 2, gap: 1 }}
        aria-label="Reason"
      >
        {NOT_DELIVERED_REASONS.map((r) => {
          const on = reason === r;
          return (
            <Box
              key={r}
              component="label"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 1.5,
                py: 0.5,
                cursor: "pointer",
                fontSize: 14,
                borderRadius: "10px",
                border: `1px solid ${on ? tokens.color.primary : tokens.color.border}`,
                bgcolor: on ? tokens.color.primarySubtle : tokens.color.card,
              }}
            >
              <Radio value={r} size="small" sx={{ p: 0.75 }} />
              {r}
            </Box>
          );
        })}
      </RadioGroup>
      <InputBase
        multiline
        minRows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        inputProps={{ "aria-label": "Note", maxLength: 200 }}
        sx={{
          mt: 1.5,
          px: 1.5,
          py: 1,
          fontSize: 14,
          borderRadius: "10px",
          border: `1px solid ${tokens.color.border}`,
        }}
      />
      <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
        <ButtonBase
          onClick={close}
          disabled={busy}
          sx={{ height: 44, borderRadius: "10px", fontWeight: 700, fontSize: 14, border: `1px solid ${tokens.color.border}` }}
        >
          Cancel
        </ButtonBase>
        <ButtonBase
          disabled={busy}
          onClick={() => {
            const extra = note.trim();
            onSubmit(extra ? `${reason} - ${extra}` : reason);
            close();
          }}
          sx={{
            height: 44,
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: 14,
            color: "#fff",
            bgcolor: tokens.color.error,
            "&.Mui-disabled": { opacity: 0.6, color: "#fff" },
          }}
        >
          Submit
        </ButtonBase>
      </Box>
    </Dialog>
  );
}
