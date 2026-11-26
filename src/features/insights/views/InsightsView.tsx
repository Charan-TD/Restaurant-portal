"use client";
import { useState } from "react";
import { DEMO_MODE } from "@/core/constants/config";
import { usePortal } from "@/core/providers/PortalProvider";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { CountTabs } from "@/shared/components/navigation/CountTabs";
import {
  INSIGHTS_PERIODS,
  PERIOD_LABEL,
  type InsightsPeriod,
} from "../models/insights";
import { useGetInsightsMetricsQuery } from "../services/insightsApi";
import { Notice, errorText } from "../components/SettlementParts";
import { OwnRidersInsights } from "./OwnRidersInsights";
import { TrainDhabaRidersInsights } from "./TrainDhabaRidersInsights";

const RANGE_TABS = INSIGHTS_PERIODS.map((id) => ({ id, label: PERIOD_LABEL[id] }));
const REFRESH_MS = 60_000;

/**
 * Insights differ by who delivers the order, because the rider is its last
 * point of contact. A restaurant with its own riders sees COD and prepaid
 * sales and its earnings; one on TrainDhaba's riders sees an item-wise
 * settlement with undelivered orders. The server decides which from the
 * restaurant's record, so the metrics answer picks the screen.
 */
export function InsightsView() {
  const [period, setPeriod] = useState<InsightsPeriod>("7d"),
    { authenticated } = usePortal(),
    { data, error, isLoading } = useGetInsightsMetricsQuery(period, {
      skip: DEMO_MODE || !authenticated,
      pollingInterval: REFRESH_MS,
    });
  return (
    <ScreenSurface>
      <CountTabs label="Insights period" value={period} onChange={setPeriod} tabs={RANGE_TABS} />
      {DEMO_MODE ? (
        <Notice>Insights are not available in demo mode.</Notice>
      ) : isLoading ? (
        <Notice>Loading Insights…</Notice>
      ) : !data ? (
        <Notice error>{errorText(error)}</Notice>
      ) : data.model === "own" ? (
        <OwnRidersInsights period={period} metrics={data} />
      ) : (
        <TrainDhabaRidersInsights period={period} metrics={data} />
      )}
    </ScreenSurface>
  );
}
