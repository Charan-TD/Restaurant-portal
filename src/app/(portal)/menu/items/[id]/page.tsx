import { MenuItemsView } from "@/features/menu/views/MenuItemsView";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MenuItemsView drawer={{ id: decodeURIComponent(id) }} />;
}
