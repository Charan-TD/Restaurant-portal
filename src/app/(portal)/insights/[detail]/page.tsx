import { Suspense } from "react";
import { notFound } from "next/navigation";
import { InsightsDetailView } from "@/features/insights/views/InsightsDetailView";
import { isDetailKind } from "@/features/insights/models/orderDetails";

// The orders behind an Insights card: /insights/total-orders, /undelivered,
// /total-sale, /cod and /prepaid. The card adds ?period= for its time range.
export default async function Page({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;
  if (!isDetailKind(detail)) notFound();
  return (
    // The view reads the address's search (?period=), which needs a boundary.
    <Suspense>
      <InsightsDetailView kind={detail} />
    </Suspense>
  );
}
