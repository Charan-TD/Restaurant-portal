"use client";
import { DEMO_MODE } from "@/core/constants/config";
import { usePortal } from "@/core/providers/PortalProvider";
import { useListMenuItemsQuery } from "@/features/menu/services/menuItemApi";
import { useGetRidersQuery } from "@/features/riders/services/riderApi";
import { useRidersOwner } from "@/features/riders/viewmodels/useRidersOwner";

/**
 * What an approved restaurant still has to do before it can go online: add a
 * menu and, if it delivers with its own riders, add those riders.
 */
export function useGoLiveSetup() {
  const { authenticated } = usePortal(),
    { ownRiders } = useRidersOwner(),
    skip = DEMO_MODE || !authenticated,
    menu = useListMenuItemsQuery(undefined, { skip }),
    riders = useGetRidersQuery(undefined, { skip: skip || !ownRiders });
  // A list that could not be loaded never locks the vendor out.
  const menuDone = DEMO_MODE || !!menu.error || (menu.data?.length ?? 0) > 0,
    ridersNeeded = ownRiders && !DEMO_MODE,
    ridersDone =
      !ridersNeeded || !!riders.error || (riders.data?.length ?? 0) > 0,
    loading =
      !DEMO_MODE && (menu.isLoading || (ridersNeeded && riders.isLoading));
  return {
    loading,
    menuDone,
    ridersNeeded,
    ridersDone,
    /** True once everything needed to go online is in place. */
    ready: !loading && menuDone && ridersDone,
  };
}
export type GoLiveSetup = ReturnType<typeof useGoLiveSetup>;
