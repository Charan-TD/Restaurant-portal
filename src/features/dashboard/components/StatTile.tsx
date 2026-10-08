import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import TrendingUp from "@mui/icons-material/TrendingUp";
import TrendingDown from "@mui/icons-material/TrendingDown";
import { CommonCard } from "@/shared/components/layout/CommonCard";
export interface StatTileProps {
  label: string;
  value: string;
  icon: ReactNode;
  /** Percentage change vs. yesterday; omitted when it does not apply. */
  change?: number;
  note?: string;
}
export function StatTile({ label, value, icon, change, note }: StatTileProps) {
  const up = (change ?? 0) >= 0;
  return (
    <CommonCard className="stat-tile">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            bgcolor: "action.hover",
            color: "primary.main",
          }}
        >
          {icon}
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{ mt: 2, fontSize: 30, fontWeight: 700, lineHeight: 1.1 }}
      >
        {value}
      </Typography>
      <Box
        sx={{
          mt: 1,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          minHeight: 22,
        }}
      >
        {change !== undefined && (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.25,
              fontSize: 13,
              fontWeight: 600,
              color: up ? "success.main" : "error.main",
            }}
          >
            {up ? (
              <TrendingUp sx={{ fontSize: 18 }} />
            ) : (
              <TrendingDown sx={{ fontSize: 18 }} />
            )}
            {up ? "+" : ""}
            {change}%
          </Box>
        )}
        <Typography variant="caption" color="text.secondary">
          {note ?? "vs yesterday"}
        </Typography>
      </Box>
    </CommonCard>
  );
}
