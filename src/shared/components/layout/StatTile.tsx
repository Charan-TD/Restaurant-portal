import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { cardSx, tokens } from "@/core/theme/tokens";

/** A small white card: an uppercase label, a big number and a note under it. */
export function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <Box sx={{ ...cardSx, px: 3, py: 2.25 }}>
      <Typography
        sx={{
          fontSize: 12,
          lineHeight: "16px",
          fontWeight: 600,
          letterSpacing: "0.3px",
          textTransform: "uppercase",
          color: tokens.color.textMuted,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{ mt: 0.5, fontSize: 24, lineHeight: "32px", fontWeight: 700 }}
      >
        {value}
      </Typography>
      {note && (
        <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
          {note}
        </Typography>
      )}
    </Box>
  );
}
