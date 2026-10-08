"use client";
import { useFormContext, useWatch } from "react-hook-form";
import type { OperatingDay, RegistrationForm } from "../models/registration";
export function useHoursViewModel() {
  const form = useFormContext<RegistrationForm>(),
    days = useWatch({ control: form.control, name: "hours" });
  const updateDay = (index: number, change: Partial<OperatingDay>) =>
    form.setValue(
      "hours",
      days.map((day, i) => (i === index ? { ...day, ...change } : day)),
      { shouldDirty: true },
    );
  const updateShift = (
    dayIndex: number,
    shiftIndex: number,
    key: "start" | "end",
    value: string,
  ) =>
    updateDay(dayIndex, {
      shifts: days[dayIndex].shifts.map((shift, i) =>
        i === shiftIndex ? { ...shift, [key]: value } : shift,
      ),
    });
  const addShift = (dayIndex: number) =>
    updateDay(dayIndex, {
      shifts: [...days[dayIndex].shifts, { start: "18:00", end: "22:00" }],
    });
  const removeShift = (dayIndex: number, shiftIndex: number) =>
    updateDay(dayIndex, {
      shifts: days[dayIndex].shifts.filter((_, i) => i !== shiftIndex),
    });
  return { form, days, updateDay, updateShift, addShift, removeShift };
}
