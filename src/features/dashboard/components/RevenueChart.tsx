import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import TrendingUpOutlined from "@mui/icons-material/TrendingUpOutlined";
import ShoppingBagOutlined from "@mui/icons-material/ShoppingBagOutlined";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { MetricCard } from "@/shared/components/layout/MetricCard";
import { formatRupees } from "@/shared/utils/format";
import {
  RANGES,
  type DashboardViewModel,
  type RangeDays,
} from "../viewmodels/useDashboardViewModel";
/** Rounds up to an even, tidy axis maximum, e.g. 2,980 → 4,000. */
function niceMax(value: number) {
  if (value <= 0) return 1000;
  const unit = 10 ** Math.max(Math.floor(Math.log10(value)) - 1, 0) * 5;
  const ceil = Math.ceil(value / unit) * unit;
  return ceil % 2 ? ceil + 1 : ceil;
}
const axis = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const GRID_LINES = 4;
const CHART_HEIGHT = 220;
/** Daily revenue, worked out from the restaurant's orders. */
export function RevenueSummary({
  vm,
}: {
  vm: Pick<
    DashboardViewModel,
    | "series"
    | "total"
    | "best"
    | "change"
    | "range"
    | "setRange"
    | "average"
    | "periodOrders"
  >;
}) {
  const { series, total, best, range } = vm,
    max = niceMax(Math.max(...series.map((d) => d.total))),
    dense = series.length > 7,
    gap = dense ? 0.5 : { xs: 1, sm: 3 },
    ticks = Array.from(
      { length: GRID_LINES + 1 },
      (_, i) => (max / GRID_LINES) * (GRID_LINES - i),
    );
  return (
    <CommonCard>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" component="h2">
            Revenue summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Daily revenue for the last {range} days.
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          color="primary"
          value={range}
          aria-label="Revenue period"
          onChange={(_, days: RangeDays | null) => days && vm.setRange(days)}
          sx={{
            "& .MuiToggleButton-root": { px: 2, fontWeight: 600 },
            "& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover":
              { bgcolor: "primary.main", color: "primary.contrastText" },
          }}
        >
          {RANGES.map((days) => (
            <ToggleButton key={days} value={days}>
              {days} days
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
      <Box
        sx={{
          mt: 2,
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        <MetricCard
          label="This period"
          hint="Total revenue for the selected days."
          value={formatRupees(total)}
          icon={<BarChartOutlined />}
        />
        <MetricCard
          label="Best day"
          hint="The day with the highest revenue in this period."
          value={best ? formatRupees(best.total) : "–"}
          note={best?.label}
          icon={<EmojiEventsOutlined />}
        />
        <MetricCard
          label="Daily average"
          hint="Total revenue divided by the number of days."
          value={formatRupees(vm.average)}
          note="per day"
          icon={<TrendingUpOutlined />}
        />
        <MetricCard
          label="Orders"
          hint="Orders placed in the selected days."
          value={vm.periodOrders}
          note={`in the last ${range} days`}
          icon={<ShoppingBagOutlined />}
        />
      </Box>
      <Box
        sx={{
          mt: 3,
          display: "grid",
          gridTemplateColumns: "56px minmax(0, 1fr)",
          columnGap: 1,
        }}
      >
        <Box
          sx={{
            height: CHART_HEIGHT,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textAlign: "right",
            color: "text.secondary",
          }}
        >
          {ticks.map((tick) => (
            <Typography key={tick} variant="caption" sx={{ lineHeight: 1 }}>
              {axis(tick)}
            </Typography>
          ))}
        </Box>
        <Box
          sx={{
            height: CHART_HEIGHT,
            display: "grid",
            gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))`,
            gap,
            alignItems: "end",
            borderBottom: 1,
            borderColor: "divider",
            backgroundImage:
              "linear-gradient(to bottom, #e6eae6 1px, transparent 1px)",
            backgroundSize: `100% ${100 / GRID_LINES}%`,
            backgroundRepeat: "repeat-y",
          }}
        >
          {series.map((day) => (
            <Box
              key={day.label}
              title={`${day.label}: ${formatRupees(day.total)}`}
              sx={{
                justifySelf: "center",
                width: "100%",
                maxWidth: 56,
                height: `${Math.max((day.total / max) * 100, 2)}%`,
                borderRadius: "6px 6px 0 0",
                bgcolor: "primary.main",
              }}
            />
          ))}
        </Box>
        <span />
        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))`,
            gap,
            textAlign: "center",
          }}
        >
          {series.map((day, i) => (
            <Box
              key={day.label}
              sx={{
                minWidth: 0,
                // On phones show every other date so the labels do not collide.
                ...(i % 2 === 1 && {
                  visibility: { xs: "hidden", sm: "visible" },
                }),
              }}
            >
              {(!dense || i % 3 === 0) && (
                <>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "block",
                      whiteSpace: "nowrap",
                      fontSize: { xs: 10, sm: 12 },
                    }}
                  >
                    {day.label}
                  </Typography>
                  {!dense && (
                    <Typography
                      variant="caption"
                      sx={{
                        display: { xs: "none", sm: "block" },
                        fontWeight: 700,
                      }}
                    >
                      {formatRupees(day.total)}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </CommonCard>
  );
}
