import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import { CommonCard } from "@/shared/components/layout/CommonCard";

/** A headline number with its icon and change since last month. */
export function CustomerStatCard({
  icon,
  label,
  value,
  change,
  tint = "#fdeee6",
  iconColor = "primary.main",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  /** e.g. "12%"; left out when there is nothing to compare with. */
  change?: string;
  tint?: string;
  iconColor?: string;
}) {
  return (
    <CommonCard
      style={{ display: "flex", alignItems: "center", gap: 20, padding: 20 }}
    >
      <Box
        sx={{
          width: 68,
          height: 68,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: tint,
          color: iconColor,
          "& svg": { fontSize: 32 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography color="text.secondary">{label}</Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            flexWrap: "wrap",
            columnGap: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 32, fontWeight: 800, lineHeight: 1.25 }}>
            {value}
          </Typography>
          {change && (
            <Typography
              variant="body2"
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                color: "success.main",
                fontWeight: 600,
              }}
            >
              <ArrowUpward sx={{ fontSize: 15 }} />
              {change}
              <Typography
                variant="body2"
                component="span"
                color="text.secondary"
                sx={{ ml: 1, fontWeight: 400 }}
              >
                vs last month
              </Typography>
            </Typography>
          )}
        </Box>
      </Box>
    </CommonCard>
  );
}
