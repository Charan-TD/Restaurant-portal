"use client";
import { useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { ORDER_PREP } from "@/core/constants/orderPrep";
import { errorMessage } from "@/shared/utils/errors";
import {
  DEFAULT_CLOSES,
  DEFAULT_OPENS,
  WEEK_DAYS,
  useGetWorkingHoursQuery,
  useUpdateWorkingHoursMutation,
  type WorkingDay,
  type WorkingHours,
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
    [prep, setPrep] = useState<number>(ORDER_PREP.fallback),
    [savedPrep, setSavedPrep] = useState<number>(ORDER_PREP.fallback),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    hoursQuery = useGetWorkingHoursQuery(undefined, { skip: DEMO_MODE }),
    [updateWorkingHours] = useUpdateWorkingHoursMutation(),
    [done, setDone] = useState(false);
  // Show the saved hours and prep time once they have loaded.
  const loadedHours = hoursQuery.data;
  const [syncedHours, setSyncedHours] = useState<WorkingHours>();
  if (loadedHours && loadedHours !== syncedHours) {
    setSyncedHours(loadedHours);
    setDays(loadedHours.days);
    setSaved(loadedHours.days);
    setPrep(loadedHours.orderPrepMinutes);
    setSavedPrep(loadedHours.orderPrepMinutes);
  }
  const loading = !DEMO_MODE && hoursQuery.isLoading;
  const edit = (index: number, change: Partial<WorkingDay>) => {
    setDone(false);
    setDays((old) =>
      old.map((d, i) => (i === index ? { ...d, ...change } : d)),
    );
  };
  const editPrep = (minutes: number) => {
    setDone(false);
    setPrep(minutes);
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
    dirty =
      JSON.stringify(days) !== JSON.stringify(saved) || prep !== savedPrep;
  const save = async () => {
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      if (!DEMO_MODE)
        await updateWorkingHours({ days, orderPrepMinutes: prep }).unwrap();
      setSaved(days);
      setSavedPrep(prep);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return {
    days,
    prep,
    loading,
    busy,
    error: error || (hoursQuery.error ? errorMessage(hoursQuery.error) : ""),
    done,
    problem,
    dirty,
    edit,
    editPrep,
    bulk,
    setBulk,
    bulkInvalid: bulk.end <= bulk.start,
    applyToAll,
    openAllDay,
    save,
    reset: () => {
      setDays(saved);
      setPrep(savedPrep);
      setError("");
    },
    dismissDone: () => setDone(false),
  };
}
