"use client";
import { Box, Tooltip, Typography } from "@mui/material";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { formatRupees } from "@/shared/utils/format";
import type { DailyRevenue } from "../models/dashboard";
const CHART_HEIGHT = 180;
/** Revenue summary: one series, so one hue; today is the full-strength bar. */
export function RevenueChart({ data }: { data: DailyRevenue[] }) {
  const max = Math.max(...data.map((d) => d.amount), 1),
    week = data.reduce((sum, d) => sum + d.amount, 0),
    best = data.reduce((a, b) => (b.amount > a.amount ? b : a), data[0]);
  return (
    <CommonCard>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <div>
          <Typography variant="h6" component="h2">
            Revenue summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last 7 days
          </Typography>
        </div>
        <Box sx={{ display: "flex", gap: 4 }}>
          <div>
            <Typography variant="caption" color="text.secondary">
              This week
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {formatRupees(week)}
            </Typography>
          </div>
          <div>
            <Typography variant="caption" color="text.secondary">
              Best day
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>
              {best?.day} · {formatRupees(best?.amount ?? 0)}
            </Typography>
          </div>
        </Box>
      </Box>
      <Box
        role="list"
        aria-label="Daily revenue, last 7 days"
        sx={{
          mt: 4,
          display: "grid",
          gridTemplateColumns: `repeat(${data.length}, 1fr)`,
          gap: { xs: 1, sm: 2 },
          alignItems: "end",
          height: CHART_HEIGHT + 28,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {data.map((d, i) => {
          const isToday = i === data.length - 1;
          return (
            <Tooltip
              key={d.day}
              title={`${d.day}: ${formatRupees(d.amount)}`}
              placement="top"
              arrow
            >
              <Box
                role="listitem"
                tabIndex={0}
                aria-label={`${d.day}: ${formatRupees(d.amount)}`}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  cursor: "default",
                  outline: "none",
                  "&:hover > .bar, &:focus-visible > .bar": {
                    opacity: 1,
                  },
                }}
              >
                {isToday && (
                  <Typography
                    variant="caption"
                    sx={{ mb: 0.5, fontWeight: 700 }}
                  >
                    {formatRupees(d.amount)}
                  </Typography>
                )}
                <Box
                  className="bar"
                  sx={{
                    width: "100%",
                    maxWidth: 36,
                    height: (d.amount / max) * CHART_HEIGHT,
                    borderRadius: "4px 4px 0 0",
                    bgcolor: "primary.main",
                    opacity: isToday ? 1 : 0.32,
                    transition: "opacity .15s",
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>
      <Box
        aria-hidden
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${data.length}, 1fr)`,
          gap: { xs: 1, sm: 2 },
          mt: 1,
        }}
      >
        {data.map((d, i) => (
          <Typography
            key={d.day}
            variant="caption"
            color={i === data.length - 1 ? "text.primary" : "text.secondary"}
            sx={{
              textAlign: "center",
              fontWeight: i === data.length - 1 ? 700 : 400,
            }}
          >
            {d.day}
          </Typography>
        ))}
      </Box>
    </CommonCard>
  );
}
