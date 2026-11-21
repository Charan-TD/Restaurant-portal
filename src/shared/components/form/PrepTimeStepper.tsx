"use client";
import { Box, IconButton, Typography } from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import RemoveOutlined from "@mui/icons-material/RemoveOutlined";
import { tokens } from "@/core/theme/tokens";
import { ORDER_PREP, clampPrep } from "@/core/constants/orderPrep";

/** Minutes with − and + buttons, in steps of ORDER_PREP.step. */
export function PrepTimeStepper({
  value,
  onChange,
  label = "Order prep time",
  fullWidth = false,
}: {
  value: number;
  onChange: (minutes: number) => void;
  label?: string;
  /** Stretches the bar across its parent, with the value centred in it. */
  fullWidth?: boolean;
}) {
  return (
    <Box
      sx={{
        display: fullWidth ? "flex" : "inline-flex",
        width: fullWidth ? "100%" : "auto",
        alignItems: "center",
        height: 48,
        px: 0.5,
        borderRadius: tokens.radius.input,
        border: `1.5px solid ${tokens.color.borderInput}`,
        bgcolor: tokens.color.card,
      }}
    >
      <IconButton
        aria-label={`Less ${label.toLowerCase()}`}
        disabled={value <= ORDER_PREP.min}
        onClick={() => onChange(clampPrep(value - ORDER_PREP.step))}
        sx={{ color: tokens.color.primary }}
      >
        <RemoveOutlined fontSize="small" />
      </IconButton>
      <Typography sx={{ flex: fullWidth ? 1 : "0 0 auto", minWidth: 88, textAlign: "center", fontSize: 15, fontWeight: 700 }}>
        {value} min
      </Typography>
      <IconButton
        aria-label={`More ${label.toLowerCase()}`}
        disabled={value >= ORDER_PREP.max}
        onClick={() => onChange(clampPrep(value + ORDER_PREP.step))}
        sx={{ color: tokens.color.primary }}
      >
        <AddOutlined fontSize="small" />
      </IconButton>
    </Box>
  );
}
