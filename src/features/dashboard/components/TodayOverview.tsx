import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import ShoppingBagOutlined from "@mui/icons-material/ShoppingBagOutlined";
import AssignmentOutlined from "@mui/icons-material/AssignmentOutlined";
import StarBorderRounded from "@mui/icons-material/StarBorderRounded";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { formatRupees } from "@/shared/utils/format";
import type { DashboardViewModel } from "../viewmodels/useDashboardViewModel";
function Tile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  tone: { bg: string; fg: string };
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.75,
        border: 1,
        borderColor: "divider",
        borderRadius: "14px",
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          bgcolor: tone.bg,
          color: tone.fg,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" noWrap>
          {label}
        </Typography>
        <Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
/** Key numbers for today. There is no ratings API yet, so the rating shows a dash. */
export function TodayOverview({
  overview,
}: {
  overview: DashboardViewModel["overview"];
}) {
  return (
    <CommonCard style={{ height: "100%" }}>
      <Typography variant="h6" component="h2">
        Today&apos;s overview
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Key stats for today&apos;s business.
      </Typography>
      <Box
        sx={{
          mt: 2.5,
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <Tile
          label="Today's orders"
          value={String(overview.orders)}
          icon={<ReceiptLongOutlined />}
          tone={{ bg: "rgba(242,106,46,.12)", fg: "#f26a2e" }}
        />
        <Tile
          label="Today's revenue"
          value={formatRupees(overview.revenue)}
          icon={<ShoppingBagOutlined />}
          tone={{ bg: "rgba(46,125,50,.12)", fg: "#2e7d32" }}
        />
        <Tile
          label="Preparing orders"
          value={String(overview.preparing)}
          icon={<AssignmentOutlined />}
          tone={{ bg: "rgba(224,155,0,.16)", fg: "#c98a00" }}
        />
        <Tile
          label="Customer rating"
          value="–"
          icon={<StarBorderRounded />}
          tone={{ bg: "rgba(25,118,210,.12)", fg: "#1976d2" }}
        />
      </Box>
    </CommonCard>
  );
}
