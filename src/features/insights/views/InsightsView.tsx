"use client";
import { useState } from "react";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { CountTabs } from "@/shared/components/navigation/CountTabs";
import { useRidersOwner } from "@/features/riders/viewmodels/useRidersOwner";
import { OwnRidersInsights } from "./OwnRidersInsights";
import { TrainDhabaRidersInsights } from "./TrainDhabaRidersInsights";

type InsightsRange = "today" | "7" | "30";
const RANGE_TABS: { id: InsightsRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "7", label: "Last 7 days" },
  { id: "30", label: "Last 30 days" },
];
const PERIOD: Record<InsightsRange, string> = {
  today: "Today",
  "7": "Last 7 days",
  "30": "Last 30 days",
};

/**
 * Insights differ by who delivers: a restaurant with its own riders sees its
 * COD and prepaid sales and earnings; one on TrainDhaba's riders sees an
 * item-wise settlement with undelivered orders. Both screens show sample data
 * until the settlement API exists (see models/settlement.ts).
 */
export function InsightsView() {
  const [range, setRange] = useState<InsightsRange>("7"),
    { trainDhabaRiders } = useRidersOwner();
  return (
    <ScreenSurface>
      <CountTabs label="Insights period" value={range} onChange={setRange} tabs={RANGE_TABS} />
      {trainDhabaRiders ? (
        <TrainDhabaRidersInsights period={PERIOD[range]} />
      ) : (
        <OwnRidersInsights period={PERIOD[range]} />
      )}
    </ScreenSurface>
  );
}
