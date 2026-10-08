import { notFound } from "next/navigation";
import { findNavPage } from "@/core/constants/navigation";
import { SectionView } from "@/features/portal/views/SectionView";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string; page: string }>;
}) {
  const { section, page } = await params;
  const match = findNavPage(`/${section}/${page}`);
  if (!match) notFound();
  return <SectionView section={match.section} page={match.page} />;
}
