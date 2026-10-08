import { Box, LinearProgress, Typography } from "@mui/material";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutlined";
import AccessTime from "@mui/icons-material/AccessTime";
import HighlightOff from "@mui/icons-material/HighlightOff";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import type { DashboardSummary } from "../models/dashboard";
export function OrderStatusBreakdown({
  status,
}: {
  status: DashboardSummary["orderStatus"];
}) {
  const total = status.delivered + status.inProgress + status.cancelled || 1;
  // Status colours always come with an icon and a label, never colour alone.
  const rows = [
    {
      label: "Delivered",
      value: status.delivered,
      color: "success" as const,
      icon: <CheckCircleOutline fontSize="small" color="success" />,
    },
    {
      label: "In progress",
      value: status.inProgress,
      color: "warning" as const,
      icon: <AccessTime fontSize="small" color="warning" />,
    },
    {
      label: "Cancelled",
      value: status.cancelled,
      color: "error" as const,
      icon: <HighlightOff fontSize="small" color="error" />,
    },
  ];
  return (
    <CommonCard>
      <Typography variant="h6" component="h2">
        Today&apos;s orders
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {total} orders by status
      </Typography>
      <Box sx={{ mt: 3, display: "grid", gap: 3 }}>
        {rows.map((row) => (
          <div key={row.label}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              {row.icon}
              <Typography variant="body2" sx={{ flex: 1 }}>
                {row.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {row.value}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 36, textAlign: "right" }}
              >
                {Math.round((row.value / total) * 100)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              color={row.color}
              value={(row.value / total) * 100}
              aria-label={`${row.label}: ${row.value} orders`}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </div>
        ))}
      </Box>
    </CommonCard>
  );
}
