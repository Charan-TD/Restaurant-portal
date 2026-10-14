import { Box, MenuItem, Select, Typography } from "@mui/material";
import ArrowUpward from "@mui/icons-material/ArrowUpward";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import { CommonCard } from "@/shared/components/layout/CommonCard";
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
/** Daily revenue, worked out from the restaurant's orders. */
export function RevenueSummary({
  vm,
}: {
  vm: Pick<
    DashboardViewModel,
    "series" | "total" | "best" | "change" | "range" | "setRange"
  >;
}) {
  const { series, total, best, change, range } = vm,
    max = niceMax(Math.max(...series.map((d) => d.total))),
    dense = series.length > 7,
    gap = dense ? 0.5 : { xs: 1, sm: 3 };
  return (
    <CommonCard style={{ height: "100%" }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography variant="h6" component="h2">
            Revenue summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Daily revenue for the last {range} days.
          </Typography>
        </Box>
        <Select
          size="small"
          value={range}
          onChange={(e) => vm.setRange(e.target.value as RangeDays)}
          inputProps={{ "aria-label": "Revenue period" }}
          sx={{ minWidth: 140, fontWeight: 600 }}
        >
          {RANGES.map((days) => (
            <MenuItem key={days} value={days}>
              Last {days} days
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ display: "flex", gap: 3 }}>
          <div>
            <Typography variant="caption" color="text.secondary">
              This period
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
              {formatRupees(total)}
            </Typography>
            {change !== null && (
              <Typography
                variant="caption"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontWeight: 700,
                  color: change >= 0 ? "success.main" : "error.main",
                }}
              >
                {change >= 0 ? (
                  <ArrowUpward sx={{ fontSize: 14 }} />
                ) : (
                  <ArrowDownward sx={{ fontSize: 14 }} />
                )}
                {Math.abs(change)}%
              </Typography>
            )}
          </div>
          <Box sx={{ pl: 3, borderLeft: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">
              Best day
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
              {best ? formatRupees(best.total) : "–"}
            </Typography>
            {best && (
              <Typography variant="caption" color="text.secondary">
                ({best.label})
              </Typography>
            )}
          </Box>
        </Box>
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
            height: 150,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textAlign: "right",
            color: "text.secondary",
          }}
        >
          {[max, max / 2, 0].map((tick) => (
            <Typography key={tick} variant="caption" sx={{ lineHeight: 1 }}>
              {axis(tick)}
            </Typography>
          ))}
        </Box>
        <Box
          sx={{
            height: 150,
            display: "grid",
            gridTemplateColumns: `repeat(${series.length}, minmax(0, 1fr))`,
            gap,
            alignItems: "end",
            borderBottom: 1,
            borderColor: "divider",
            backgroundImage:
              "linear-gradient(to bottom, #e6eae6 1px, transparent 1px)",
            backgroundSize: "100% 50%",
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
                bgcolor:
                  best && day.label === best.label
                    ? "primary.main"
                    : "rgba(242,106,46,.4)",
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
