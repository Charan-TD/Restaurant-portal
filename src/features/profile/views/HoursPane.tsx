"use client";
import { useState } from "react";
import { Box, ButtonBase, Skeleton, Typography } from "@mui/material";
import { ToggleSwitch } from "@/shared/components/form/ToggleSwitch";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { useWorkingHoursViewModel } from "../viewmodels/useWorkingHoursViewModel";
import { PaneFooter, SubHeading } from "./PaneParts";
import { PaneHeading } from "./PaneHeading";

function TimeRange({
  start,
  end,
  onStart,
  onEnd,
  label,
}: {
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
  label: string;
}) {
  const bad = end <= start;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <CommonTextField
        type="time"
        value={start}
        onChange={(e) => onStart(e.target.value)}
        slotProps={{ htmlInput: { "aria-label": `${label} opens` } }}
        sx={{ width: 150, "& .MuiOutlinedInput-root": { minHeight: 44 } }}
      />
      <Typography sx={{ color: tokens.color.textMuted }}>–</Typography>
      <CommonTextField
        type="time"
        value={end}
        error={bad}
        onChange={(e) => onEnd(e.target.value)}
        slotProps={{ htmlInput: { "aria-label": `${label} closes` } }}
        sx={{ width: 150, "& .MuiOutlinedInput-root": { minHeight: 44 } }}
      />
      {bad && (
        <Typography sx={{ fontSize: 12, color: tokens.color.error }}>
          Close after opening
        </Typography>
      )}
    </Box>
  );
}

/** Weekly opening hours: one set for every day, or each day on its own. */
export function HoursPane() {
  const vm = useWorkingHoursViewModel(),
    allSame = vm.days.every(
      (d) => d.open && d.start === vm.days[0].start && d.end === vm.days[0].end,
    ),
    [chosen, setChosen] = useState<"same" | "different" | null>(null),
    mode = chosen ?? (allSame ? "same" : "different"),
    setAll = (change: { start?: string; end?: string }) =>
      vm.days.forEach((_, i) => vm.edit(i, { open: true, ...change }));
  return (
    <>
      <PaneHeading
        title="Operating hours"
        subtitle="Passengers can order only when you are open"
      />
      <Box sx={{ p: 3 }}>
        {vm.done && (
          <ToastAlert severity="success" onClose={vm.dismissDone} sx={{ mb: 2 }}>
            Working hours updated.
          </ToastAlert>
        )}
        {vm.error && (
          <ToastAlert severity="error" sx={{ mb: 2 }}>
            {vm.error}
          </ToastAlert>
        )}
        <SubHeading>Weekly hours</SubHeading>
        <Box
          role="group"
          aria-label="Hours mode"
          sx={{
            display: "inline-flex",
            p: 0.5,
            mb: 2.5,
            gap: 0.5,
            borderRadius: tokens.radius.input,
            bgcolor: tokens.color.muted,
          }}
        >
          {(
            [
              ["same", "Same every day"],
              ["different", "Different by day"],
            ] as const
          ).map(([value, label]) => (
            <ButtonBase
              key={value}
              aria-pressed={mode === value}
              onClick={() => setChosen(value)}
              sx={{
                px: 2,
                py: 0.75,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: "8px",
                bgcolor: mode === value ? tokens.color.card : "transparent",
                boxShadow: mode === value ? tokens.shadow.card : "none",
              }}
            >
              {label}
            </ButtonBase>
          ))}
        </Box>
        {vm.loading ? (
          Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} height={52} sx={{ my: 0.5 }} />
          ))
        ) : mode === "same" ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1 }}>
            <Typography sx={{ width: 120, fontWeight: 600 }}>Every day</Typography>
            <TimeRange
              label="Every day"
              start={vm.days[0].start}
              end={vm.days[0].end}
              onStart={(start) => setAll({ start })}
              onEnd={(end) => setAll({ end })}
            />
          </Box>
        ) : (
          vm.days.map((day, i) => (
            <Box
              key={day.day}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 2,
                py: 1.5,
                borderBottom:
                  i < vm.days.length - 1
                    ? `1px solid ${tokens.color.borderSubtle}`
                    : 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: 160 }}>
                <ToggleSwitch
                  checked={day.open}
                  onChange={(e) => vm.edit(i, { open: e.target.checked })}
                  slotProps={{ input: { "aria-label": `${day.day} open` } }}
                />
                <Typography sx={{ fontWeight: 600 }}>{day.day}</Typography>
              </Box>
              {day.open ? (
                <TimeRange
                  label={day.day}
                  start={day.start}
                  end={day.end}
                  onStart={(start) => vm.edit(i, { start })}
                  onEnd={(end) => vm.edit(i, { end })}
                />
              ) : (
                <Typography sx={{ color: tokens.color.textMuted }}>
                  Closed all day
                </Typography>
              )}
            </Box>
          ))
        )}
      </Box>
      <PaneFooter>
        <CommonButton variant="text" onClick={vm.reset} disabled={!vm.dirty || vm.busy}>
          Cancel
        </CommonButton>
        <CommonButton
          variant="contained"
          onClick={vm.save}
          disabled={!vm.dirty || vm.busy || vm.loading || !!vm.problem}
        >
          {vm.busy ? "Saving…" : "Save changes"}
        </CommonButton>
      </PaneFooter>
    </>
  );
}
