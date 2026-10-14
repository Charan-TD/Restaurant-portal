"use client";
import { useEffect, useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { errorMessage } from "@/shared/utils/errors";
import {
  DEFAULT_CLOSES,
  DEFAULT_OPENS,
  WEEK_DAYS,
  getWorkingHours,
  updateWorkingHours,
  type WorkingDay,
} from "../services/restaurantService";
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
    [loading, setLoading] = useState(!DEMO_MODE),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  useEffect(() => {
    if (DEMO_MODE) return;
    let cancelled = false;
    getWorkingHours()
      .then((hours) => {
        if (cancelled) return;
        setDays(hours);
        setSaved(hours);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);
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
  const problem = hoursProblem(days),
    dirty = JSON.stringify(days) !== JSON.stringify(saved);
  const save = async () => {
    if (problem) return setError(problem);
    setBusy(true);
    setError("");
    try {
      if (!DEMO_MODE) await updateWorkingHours(days);
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
    error,
    done,
    problem,
    dirty,
    edit,
    bulk,
    setBulk,
    bulkInvalid: bulk.end <= bulk.start,
    applyToAll,
    save,
    reset: () => {
      setDays(saved);
      setError("");
    },
    dismissDone: () => setDone(false),
  };
}
