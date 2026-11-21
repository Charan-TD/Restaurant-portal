/**
 * The order prep time: one fixed number of minutes for every order, saved with
 * the operating hours. Passengers and riders see the food-ready time from it.
 */
export const ORDER_PREP = {
  min: 5,
  max: 240,
  step: 5,
  fallback: 20,
} as const;

/** The key the operating-hours request and response carry the prep time under. */
export const ORDER_PREP_KEY = "ord_prep_time";

/** Rounds to the nearest step and keeps it inside the allowed range. */
export function clampPrep(minutes: number) {
  const rounded = Math.round(minutes / ORDER_PREP.step) * ORDER_PREP.step;
  return Math.min(ORDER_PREP.max, Math.max(ORDER_PREP.min, rounded));
}
