import { notFound } from "next/navigation";
import { InsightsDetailView } from "@/features/insights/views/InsightsDetailView";
import { isDetailKind } from "@/features/insights/models/orderDetails";

// The orders behind an Insights card: /insights/total-orders, /undelivered,
// /total-sale, /cod and /prepaid.
export default async function Page({
  params,
}: {
  params: Promise<{ detail: string }>;
}) {
  const { detail } = await params;
  if (!isDetailKind(detail)) notFound();
  return <InsightsDetailView kind={detail} />;
}
