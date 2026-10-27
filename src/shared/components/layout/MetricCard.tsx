import type { ReactNode } from "react";
import { Box, Tooltip, Typography } from "@mui/material";

/** Every metric card in the portal is this tall, so rows of them line up. */
export const METRIC_CARD_HEIGHT = 84;

/** A headline number with its icon, a heading above it and an optional note. */
export function MetricCard({
  icon,
  label,
  value,
  note,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  note?: ReactNode;
  /** What the number means, shown on hover. */
  hint?: string;
}) {
  return (
    <Tooltip title={hint ?? ""} arrow enterDelay={300} placement="top">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          minWidth: 0,
          height: METRIC_CARD_HEIGHT,
          px: 2,
          borderRadius: "12px",
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            color: "primary.main",
            "& svg": { fontSize: 32 },
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            color="text.secondary"
            sx={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35 }}
          >
            {label}
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3 }}>
            {value}
          </Typography>
          {note &&
            (typeof note === "string" ? (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                component="div"
              >
                {note}
              </Typography>
            ) : (
              note
            ))}
        </Box>
      </Box>
    </Tooltip>
  );
}
