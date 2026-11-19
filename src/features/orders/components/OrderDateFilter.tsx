"use client";
import { useState } from "react";
import { Box, ButtonBase, Popover, Typography } from "@mui/material";
import CheckRounded from "@mui/icons-material/CheckRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import FilterAlt from "@mui/icons-material/FilterAlt";
import FilterAltOutlined from "@mui/icons-material/FilterAltOutlined";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import {
  dayMonth,
  endOfDay,
  presetLabels,
  presetRange,
  rangeDates,
  startOfDay,
  type DateRange,
} from "../models/dateRange";

const presets = Object.keys(presetLabels) as (keyof typeof presetLabels)[];
const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/**
 * The filter button beside the search box: a list of date ranges, and
 * "Custom range…" opens a calendar to pick the first and last day.
 */
export function OrderDateFilter({
  value,
  onChange,
}: {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      {/* A plain icon like the search icon beside it: no hover or ripple; filled and orange while a filter is on. */}
      <ButtonBase
        disableRipple
        aria-label="Filter orders by date"
        aria-pressed={!!value}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{
          flexShrink: 0,
          color: value ? tokens.color.primary : tokens.color.textMuted,
        }}
      >
        {value ? <FilterAlt sx={{ fontSize: 20 }} /> : <FilterAltOutlined sx={{ fontSize: 20 }} />}
      </ButtonBase>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { mt: 1, borderRadius: "16px", boxShadow: "0 8px 28px rgba(0,0,0,0.14)" } } }}
      >
        <FilterPanel value={value} onChange={onChange} close={() => setAnchor(null)} />
      </Popover>
    </>
  );
}

/**
 * What the open filter shows: the ranges, or the calendar. It is created each
 * time the filter opens, so the ranges are counted from that moment.
 */
function FilterPanel({
  value,
  onChange,
  close,
}: {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  close: () => void;
}) {
  const [view, setView] = useState<"menu" | "calendar">("menu"),
    [now] = useState(() => Date.now());
  return view === "menu" ? (
    <Box role="menu" sx={{ width: 300, p: 1 }}>
      {presets.map((preset) => {
        const range = presetRange(preset, now),
          on = value?.preset === preset;
        return (
          <ButtonBase
            key={preset}
            role="menuitemradio"
            aria-checked={on}
            onClick={() => {
              onChange(range);
              close();
            }}
            sx={{ ...rowSx, bgcolor: on ? tokens.color.muted : "transparent", fontWeight: on ? 700 : 500 }}
          >
            <span>{presetLabels[preset]}</span>
            <Box component="span" sx={{ ml: "auto", fontSize: 12.5, fontWeight: 500, color: tokens.color.textMuted }}>
              {/* The 30-day range is long; its name says enough. */}
              {preset === "last30" ? "" : rangeDates(range)}
            </Box>
            {on && <CheckRounded sx={{ ml: 1, fontSize: 18, color: tokens.color.primary }} />}
          </ButtonBase>
        );
      })}
      <Box sx={{ my: 0.5, height: "1px", bgcolor: tokens.color.border }} />
      <ButtonBase role="menuitemradio" aria-checked={value?.preset === "custom"} onClick={() => setView("calendar")} sx={{ ...rowSx, fontWeight: value?.preset === "custom" ? 700 : 500 }}>
        <span>Custom range…</span>
        {value?.preset === "custom" && (
          <>
            <Box component="span" sx={{ ml: "auto", fontSize: 12.5, fontWeight: 500, color: tokens.color.textMuted }}>{rangeDates(value)}</Box>
            <CheckRounded sx={{ ml: 1, fontSize: 18, color: tokens.color.primary }} />
          </>
        )}
      </ButtonBase>
      {value && (
        <ButtonBase onClick={() => { onChange(null); close(); }} sx={{ ...rowSx, color: tokens.color.primary, fontWeight: 600 }}>
          Clear filter
        </ButtonBase>
      )}
    </Box>
  ) : (
    <RangeCalendar
      initial={value?.preset === "custom" ? value : null}
      now={now}
      onCancel={() => setView("menu")}
      onApply={(range) => {
        onChange(range);
        close();
      }}
    />
  );
}

const rowSx = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: 1,
  px: 1.75,
  py: 1.25,
  fontSize: 14.5,
  borderRadius: "10px",
  textAlign: "left",
  "&:hover": { bgcolor: tokens.color.sunken },
} as const;

/** A month of days, Monday first: the first and last day picked are filled, the days between shaded. */
function RangeCalendar({
  initial,
  now,
  onCancel,
  onApply,
}: {
  initial: DateRange | null;
  now: number;
  onCancel: () => void;
  onApply: (range: DateRange) => void;
}) {
  const today = startOfDay(now),
    [month, setMonth] = useState(() => {
      const d = new Date(initial?.from ?? now);
      return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    }),
    [from, setFrom] = useState<number | null>(initial ? startOfDay(initial.from) : null),
    [to, setTo] = useState<number | null>(initial ? startOfDay(initial.to) : null);
  const first = new Date(month),
    year = first.getFullYear(),
    m = first.getMonth(),
    // Monday is the first column.
    lead = (first.getDay() + 6) % 7,
    days = new Date(year, m + 1, 0).getDate(),
    cells = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => new Date(year, m, i + 1).getTime())],
    thisMonth = new Date(today).getMonth() === m && new Date(today).getFullYear() === year;
  const pick = (day: number) => {
    // A first click starts a new range; the second ends it (either way round).
    if (from === null || to !== null) {
      setFrom(day);
      setTo(null);
    } else if (day < from) {
      setTo(from);
      setFrom(day);
    } else setTo(day);
  };
  const end = to ?? from;
  return (
    <Box sx={{ width: 272, p: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <ButtonBase aria-label="Previous month" onClick={() => setMonth(new Date(year, m - 1, 1).getTime())} sx={navSx}>
          <ChevronLeftRounded sx={{ fontSize: 18 }} />
        </ButtonBase>
        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
          {first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </Typography>
        <ButtonBase aria-label="Next month" disabled={thisMonth} onClick={() => setMonth(new Date(year, m + 1, 1).getTime())} sx={{ ...navSx, opacity: thisMonth ? 0.4 : 1 }}>
          <ChevronRightRounded sx={{ fontSize: 18 }} />
        </ButtonBase>
      </Box>
      <Box role="grid" sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", rowGap: 0.5 }}>
        {weekdays.map((w) => (
          <Typography key={w} sx={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: tokens.color.textMuted, pb: 0.5 }}>{w}</Typography>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span key={`e${i}`} />;
          const future = day > today,
            isEnd = day === from || day === end,
            between = from !== null && end !== null && day > from && day < end,
            // The band behind a range runs from the first to the last day.
            bandLeft = from !== null && end !== null && end > from && day > from && day <= end,
            bandRight = from !== null && end !== null && end > from && day >= from && day < end;
          return (
            <Box key={day} sx={{ position: "relative", height: 32, display: "grid", placeItems: "center" }}>
              {(bandLeft || bandRight) && (
                <Box aria-hidden sx={{ position: "absolute", top: 3, bottom: 3, left: bandLeft ? 0 : "50%", right: bandRight ? 0 : "50%", bgcolor: tokens.color.primarySubtle }} />
              )}
              <ButtonBase
                disabled={future}
                aria-label={dayMonth(day)}
                aria-pressed={isEnd || between}
                onClick={() => pick(day)}
                sx={{
                  position: "relative",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  fontSize: 12.5,
                  fontWeight: isEnd || between ? 700 : 500,
                  color: future ? tokens.color.dashed : isEnd ? "#fff" : tokens.color.text,
                  bgcolor: isEnd ? tokens.color.primary : "transparent",
                  border: day === today && !isEnd ? `1.5px solid ${tokens.color.text}` : "none",
                }}
              >
                {new Date(day).getDate()}
              </ButtonBase>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1, pt: 1, borderTop: `1px solid ${tokens.color.border}` }}>
        <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 700 }}>
          {from === null ? "Pick the first day" : end === from ? dayMonth(from) : `${dayMonth(from)} – ${dayMonth(end!)}`}
        </Typography>
        <CommonButton variant="text" size="small" onClick={onCancel}>Cancel</CommonButton>
        <CommonButton
          variant="contained"
          size="small"
          disabled={from === null}
          onClick={() => from !== null && onApply({ preset: "custom", from, to: endOfDay(end ?? from) })}
        >
          Apply
        </CommonButton>
      </Box>
    </Box>
  );
}

const navSx = { width: 30, height: 30, borderRadius: "8px", bgcolor: tokens.color.muted } as const;
