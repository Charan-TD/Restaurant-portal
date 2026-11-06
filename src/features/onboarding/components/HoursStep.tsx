"use client";
import { useState } from "react";
import {
  Box,
  ButtonBase,
  FormHelperText,
  Typography,
} from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import RadioButtonChecked from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import { tokens } from "@/core/theme/tokens";
import { TimeField } from "@/shared/components/form/TimeField";
import { ToggleSwitch } from "@/shared/components/form/ToggleSwitch";
import type { Shift } from "../models/registration";
import { useHoursViewModel } from "../viewmodels/useHoursViewModel";

// A new slot starts empty: the vendor picks the open and close time.
const DEFAULT_SHIFT: Shift = { start: "", end: "" },
  // 00:00 to 23:59 is how a 24-hour day is told to the backend.
  ALL_DAY: Shift = { start: "00:00", end: "23:59" },
  SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const sameShifts = (a: Shift[], b: Shift[]) =>
  a.length === b.length &&
  a.every((s, i) => s.start === b[i].start && s.end === b[i].end);

function Radio({
  checked,
  onClick,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <ButtonBase
      role="radio"
      aria-checked={checked}
      onClick={onClick}
      sx={{ justifyContent: "flex-start", gap: 1.25, py: 1, fontSize: 14, fontWeight: checked ? 700 : 500 }}
    >
      {checked ? (
        <RadioButtonChecked sx={{ color: tokens.color.primary }} />
      ) : (
        <RadioButtonUnchecked sx={{ color: tokens.color.borderInput }} />
      )}
      {children}
    </ButtonBase>
  );
}

/**
 * One slot. "same": two labelled fields side by side. "day": open "to" close
 * on a single line. Every row keeps a column on the right for the cross that
 * removes an added slot, so the fields never change size or move.
 */
function SlotRow({
  variant,
  label,
  start,
  end,
  onStart,
  onEnd,
  errorStart,
  errorEnd,
  onRemove,
}: {
  variant: "same" | "day";
  label: string;
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
  errorStart?: string;
  errorEnd?: string;
  onRemove?: () => void;
}) {
  const same = variant === "same",
    height = same ? 48 : 40;
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: same
          ? "minmax(0, 1fr) auto minmax(0, 1fr) 36px"
          : "minmax(0, 1fr) auto minmax(0, 1fr) 36px",
        columnGap: 1,
        alignItems: "start",
      }}
    >
      <TimeField compact={!same} label={`${label} opens`} placeholder="Open time" title="Open time" value={start} onChange={onStart} error={errorStart} />
      <Typography aria-hidden sx={{ height, lineHeight: `${height}px`, fontSize: 30, fontWeight: 300, color: tokens.color.textMuted }}>
        -
      </Typography>
      <TimeField compact={!same} label={`${label} closes`} placeholder="Close time" title="Close time" value={end} onChange={onEnd} error={errorEnd} />
      <Box sx={{ height, display: "grid", placeItems: "center" }}>
        {onRemove && (
          <ButtonBase
            aria-label="Remove slot"
            title="Remove slot"
            onClick={onRemove}
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              color: tokens.color.textMuted,
              "&:hover": { color: tokens.color.text, bgcolor: tokens.color.muted },
            }}
          >
            <CloseOutlined sx={{ fontSize: 18 }} />
          </ButtonBase>
        )}
      </Box>
    </Box>
  );
}

/** Operating hours: the same slots on every working day, or each day on its own. */
export function HoursStep() {
  const vm = useHoursViewModel(),
    { days } = vm,
    errors = vm.form.formState.errors.hours,
    firstOpen = days.findIndex((d) => d.open),
    reference = days[firstOpen]?.shifts ?? [DEFAULT_SHIFT],
    openDays = days.filter((d) => d.open),
    [chosen, setChosen] = useState<"same" | "different" | null>(null),
    mode =
      chosen ??
      (openDays.every((d) => sameShifts(d.shifts, reference)) ? "same" : "different"),
    write = (next: typeof days) =>
      vm.form.setValue("hours", next, {
        shouldDirty: true,
        shouldValidate: vm.form.formState.isSubmitted,
      }),
    setAll = (shifts: Shift[]) => write(days.map((d) => ({ ...d, shifts })));
  const changeMode = (next: "same" | "different") => {
    setChosen(next);
    // Going back to one set of hours applies the first working day's to all.
    if (next === "same") setAll(reference);
  };
  const around =
      reference.length === 1 &&
      reference[0].start === ALL_DAY.start &&
      reference[0].end === ALL_DAY.end;
  // "Copy <day> to all": the first open day whose slots are all filled in.
  const copySource = days.find(
    (d) => d.open && d.shifts.length > 0 && d.shifts.every((s) => s.start && s.end),
  );
  const slotError = (i: number, j: number, key: "start" | "end") =>
    errors?.[i]?.shifts?.[j]?.[key]?.message;
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <Box>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.5 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
            Opening &amp; closing time
          </Typography>
        </Box>
        <Box role="radiogroup" aria-label="Opening and closing time" sx={{ display: "grid" }}>
          <Radio checked={mode === "same"} onClick={() => changeMode("same")}>
            I open and close at the same time on all working days
          </Radio>
          <Radio checked={mode === "different"} onClick={() => changeMode("different")}>
            I have separate day-wise timings
          </Radio>
        </Box>
      </Box>
      {mode === "same" ? (
        <>
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Working days</Typography>
            <Typography sx={{ mb: 1.25, fontSize: 12, color: tokens.color.textMuted }}>
              {openDays.length} {openDays.length === 1 ? "day" : "days"} a week
              {openDays.length < 7
                ? ` · closed on ${days
                    .filter((d) => !d.open)
                    .map((d) => d.day)
                    .join(", ")}`
                : ""}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {days.map((day, i) => (
                <ButtonBase
                  key={day.day}
                  role="checkbox"
                  aria-checked={day.open}
                  aria-label={day.day}
                  onClick={() => vm.updateDay(i, { open: !day.open, shifts: reference })}
                  sx={{
                    height: 36,
                    px: 1.75,
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: "10px",
                    color: day.open ? "#fff" : tokens.color.text,
                    bgcolor: day.open ? tokens.color.text : tokens.color.card,
                    border: `1.5px solid ${day.open ? tokens.color.text : tokens.color.borderInput}`,
                  }}
                >
                  {SHORT[i]}
                </ButtonBase>
              ))}
            </Box>
          </Box>
          <Box>
            <Typography sx={{ mb: 1.25, fontSize: 16, fontWeight: 700 }}>Time slots</Typography>
            {around ? (
              <ButtonBase
                onClick={() => setAll([DEFAULT_SHIFT])}
                sx={{ fontSize: 14, fontWeight: 600, color: tokens.color.link }}
              >
                Set specific hours instead
              </ButtonBase>
            ) : (
            <>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {reference.map((shift, j) => (
                <SlotRow
                  variant="same"
                  key={j}
                  label={`Slot ${j + 1}`}
                  start={shift.start}
                  end={shift.end}
                  onStart={(v) => setAll(reference.map((x, k) => (k === j ? { ...x, start: v } : x)))}
                  onEnd={(v) => setAll(reference.map((x, k) => (k === j ? { ...x, end: v } : x)))}
                  errorStart={slotError(Math.max(firstOpen, 0), j, "start")}
                  errorEnd={slotError(Math.max(firstOpen, 0), j, "end")}
                  onRemove={j > 0 ? () => setAll(reference.filter((_, k) => k !== j)) : undefined}
                />
              ))}
            </Box>
            <ButtonBase
              onClick={() => setAll([...reference, DEFAULT_SHIFT])}
              sx={{ mt: 1.5, gap: 0.5, fontSize: 14, fontWeight: 600, color: tokens.color.link }}
            >
              <AddOutlined sx={{ fontSize: 18 }} />
              Add another slot
            </ButtonBase>
            </>
            )}
          </Box>
        </>
      ) : (
        <Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 1, mb: 1.25 }}>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>Day-wise timings</Typography>
              <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
                Turn a day off to mark it closed
              </Typography>
            </Box>
            {copySource && (
              <ButtonBase
                onClick={() =>
                  write(days.map((d) => (d.open ? { ...d, shifts: copySource.shifts } : d)))
                }
                sx={{ fontSize: 14, fontWeight: 600, color: tokens.color.link }}
              >
                Copy {copySource.day} to all open days
              </ButtonBase>
            )}
            </Box>
          <Box sx={{ border: `1px solid ${tokens.color.border}`, borderRadius: "12px", overflow: "hidden" }}>
            {days.map((day, i) => (
              <Box
                key={day.day}
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: day.open ? "flex-start" : "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  borderTop: i ? `1px solid ${tokens.color.borderSubtle}` : 0,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: 130, height: day.open ? 40 : "auto" }}>
                  <ToggleSwitch
                    checked={day.open}
                    onChange={(e) =>
                      vm.updateDay(i, {
                        open: e.target.checked,
                        shifts: day.shifts.length ? day.shifts : [DEFAULT_SHIFT],
                      })
                    }
                    slotProps={{ input: { "aria-label": `${day.day} open` } }}
                  />
                  <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{day.day}</Typography>
                </Box>
                {day.open ? (
                  <Box sx={{ flex: 1, minWidth: 260, display: "grid", gap: 1 }}>
                    {day.shifts.map((shift, j) => (
                      <SlotRow
                        key={j}
                        variant="day"
                        label={`${day.day} slot ${j + 1}`}
                        start={shift.start}
                        end={shift.end}
                        onStart={(v) => vm.updateShift(i, j, "start", v)}
                        onEnd={(v) => vm.updateShift(i, j, "end", v)}
                        errorStart={slotError(i, j, "start")}
                        errorEnd={slotError(i, j, "end")}
                        onRemove={j > 0 ? () => vm.removeShift(i, j) : undefined}
                      />
                    ))}
                    <ButtonBase
                      onClick={() => vm.addShift(i)}
                      sx={{ justifySelf: "start", gap: 0.5, fontSize: 13, fontWeight: 600 }}
                    >
                      <AddOutlined sx={{ fontSize: 16 }} />
                      Add slot
                    </ButtonBase>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 14, color: tokens.color.textMuted }}>Closed</Typography>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          gap: 1.25,
          p: 1.75,
          fontSize: 13,
          borderRadius: "12px",
          bgcolor: tokens.color.muted,
          color: tokens.color.textMuted,
        }}
      >
        <InfoOutlined sx={{ fontSize: 18, mt: "1px" }} />
        Longer opening hours bring more orders from passing trains and help you
        avoid cancellations. Cover lunch (12:00–15:00) and dinner (19:00–22:00) at least.
      </Box>
      {vm.form.formState.errors.hours && (
        <FormHelperText error>
          {vm.form.formState.errors.hours.message ||
            vm.form.formState.errors.hours.root?.message ||
            "Check operating shifts."}
        </FormHelperText>
      )}
    </Box>
  );
}
