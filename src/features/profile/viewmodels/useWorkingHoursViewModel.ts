"use client";
import { useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { errorMessage } from "@/shared/utils/errors";
import {
  DEFAULT_CLOSES,
  DEFAULT_OPENS,
  WEEK_DAYS,
  useGetWorkingHoursQuery,
  useUpdateWorkingHoursMutation,
  type WorkingDay,
} from "../services/restaurantApi";
const defaults = (): WorkingDay[] =>
  WEEK_DAYS.map((day) => ({
    day,
    open: true,
    start: DEFAULT_OPENS,
    end: DEFAULT_CLOSES,
  }));
/** The first problem with the hours, or "" when they can be saved. */
export function hoursProblem(days: WorkingDay[]) {
  if (!days.some((d) => d.open)) return "Keep at least one day open.";
  const bad = days.find(
    (d) => d.open && (!d.start || !d.end || d.end <= d.start),
  );
  return bad ? `${bad.day}: closing time must be after opening time.` : "";
}
export function useWorkingHoursViewModel() {
  const [days, setDays] = useState<WorkingDay[]>(defaults),
    [saved, setSaved] = useState<WorkingDay[]>(defaults),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    hoursQuery = useGetWorkingHoursQuery(undefined, { skip: DEMO_MODE }),
    [updateWorkingHours] = useUpdateWorkingHoursMutation(),
    [done, setDone] = useState(false);
  // Show the saved hours once they have loaded.
  const loadedHours = hoursQuery.data;
  const [syncedHours, setSyncedHours] = useState<WorkingDay[]>();
  if (loadedHours && loadedHours !== syncedHours) {
    setSyncedHours(loadedHours);
    setDays(loadedHours);
    setSaved(loadedHours);
  }
  const loading = !DEMO_MODE && hoursQuery.isLoading;
  const edit = (index: number, change: Partial<WorkingDay>) => {
    setDone(false);
    setDays((old) =>
      old.map((d, i) => (i === index ? { ...d, ...change } : d)),
    );
  };
  // One set of hours that can be copied onto every day at once.
  const [bulk, setBulk] = useState({
    start: DEFAULT_OPENS,
    end: DEFAULT_CLOSES,
  });
  const applyToAll = () => {
    setDone(false);
    setDays((old) => old.map((d) => ({ ...d, open: true, ...bulk })));
  };
  // 00:00 to 23:59 is saved as a 24-hour day; edit single days afterwards.
  const openAllDay = () => {
    setDone(false);
    setDays((old) =>
      old.map((d) => ({ ...d, open: true, start: "00:00", end: "23:59" })),
    );
  };
  const problem = hoursProblem(days),
    dirty = JSON.stringify(days) !== JSON.stringify(saved);
  const save = async () => {
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      if (!DEMO_MODE) await updateWorkingHours(days).unwrap();
      setSaved(days);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return {
    days,
    loading,
    busy,
    error: error || (hoursQuery.error ? errorMessage(hoursQuery.error) : ""),
    done,
    problem,
    dirty,
    edit,
    bulk,
    setBulk,
    bulkInvalid: bulk.end <= bulk.start,
    applyToAll,
    openAllDay,
    save,
    reset: () => {
      setDays(saved);
      setError("");
    },
    dismissDone: () => setDone(false),
  };
}
