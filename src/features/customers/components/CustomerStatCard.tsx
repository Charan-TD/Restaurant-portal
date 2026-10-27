import type { ReactNode } from "react";
import { MetricCard } from "@/shared/components/layout/MetricCard";

/** A headline number with its icon, the same card used across the portal. */
export function CustomerStatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  /** What the number means, shown on hover. */
  hint?: string;
}) {
  return <MetricCard icon={icon} label={label} value={value} hint={hint} />;
}
