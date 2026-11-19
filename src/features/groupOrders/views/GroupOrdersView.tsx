"use client";
import { useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { tokens } from "@/core/theme/tokens";
import { useNow } from "@/features/orders/viewmodels/useOrdersWorkspace";
import { GroupOrderDrawer } from "../components/GroupOrderDrawer";
import { GroupOrderList } from "../components/GroupOrderList";
import { GroupOrderPanel } from "../components/GroupOrderPanel";
import { GroupOrderTile } from "../components/GroupOrderTile";
import { parse } from "../components/groupOrderFormat";
import { readyAt, tabOf, type GroupOrder, type GroupOrderTab } from "../models/groupOrder";
import { useGroupOrdersViewModel } from "../viewmodels/useGroupOrdersViewModel";

const tabs: { id: GroupOrderTab; label: string; count?: boolean; empty: string }[] = [
  { id: "upcoming", label: "Upcoming", count: true, empty: "No upcoming group orders." },
  { id: "preparing", label: "Preparing", count: true, empty: "Nothing is being prepared." },
  { id: "completed", label: "Completed", empty: "No completed group orders yet." },
];

/** Upcoming and preparing: the soonest ready time first. Completed: the latest first. */
const sorter = (tab: GroupOrderTab) => (a: GroupOrder, b: GroupOrder) =>
  tab === "completed"
    ? (parse(b.updatedAt) ?? 0) - (parse(a.updatedAt) ?? 0)
    : (readyAt(a) ?? Infinity) - (readyAt(b) ?? Infinity);

/**
 * Group orders the TrainDhaba team assigned to this restaurant, by stage.
 * Upcoming and completed orders are cards; accepted orders are worked on
 * like Manage Orders, a list on the left and the open order on the right.
 */
export function GroupOrdersView() {
  const vm = useGroupOrdersViewModel(),
    [tab, setTab] = useState<GroupOrderTab>("upcoming"),
    // The order in the side drawer (upcoming and completed cards).
    [openKey, setOpenKey] = useState<string | null>(null),
    // The order open on the right of the Preparing tab.
    [chosenKey, setChosenKey] = useState<string | null>(null),
    [search, setSearch] = useState(""),
    // The prep countdown ticks every second while the Preparing tab is open.
    tick = useNow(tab === "preparing"),
    inTab = (id: GroupOrderTab) => vm.orders.filter((o) => tabOf(o.status) === id),
    shown = inTab(tab).sort(sorter(tab)),
    current = tabs.find((t) => t.id === tab)!,
    // The open order is read from the list, so a status change shows in the panel at once.
    open = vm.orders.find((o) => o.key === openKey) ?? null,
    query = search.trim().toLowerCase(),
    working = shown.filter(
      (o) =>
        !query ||
        [o.id, o.contactName, o.trainNumber, o.trainName, o.stationName, ...o.coaches]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
    ),
    // The first order is open until one is picked; one that left the tab is dropped.
    chosen = working.find((o) => o.key === chosenKey) ?? working[0],
    handlers = {
      own: !vm.trainDhabaRiders,
      onChange: (o: GroupOrder, status: string, rider?: Parameters<typeof vm.changeOrder>[3]) =>
        void vm.changeOrder(o.key, o.id, status, rider).then((ok) => {
          // Once accepted, the order is worked on in the Preparing tab.
          if (ok && status === "PREPARING") {
            setOpenKey(null);
            setSearch("");
            setChosenKey(o.key);
            setTab("preparing");
          }
        }),
      onAssignRider: (o: GroupOrder, rider: Parameters<typeof vm.assignRider>[1]) => vm.assignRider(o.id, rider),
    };
  return (
    <Box>
      <Box
        role="tablist"
        sx={{ display: "flex", alignItems: "center", gap: 1, px: { xs: 2, md: 3 }, bgcolor: tokens.color.card, borderBottom: `1px solid ${tokens.color.border}`, overflowX: "auto" }}
      >
        {tabs.map((t) => {
          const on = tab === t.id,
            count = t.count ? inTab(t.id).length : undefined;
          return (
            <ButtonBase
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => {
                setTab(t.id);
                setChosenKey(null);
              }}
              sx={{ gap: 1, height: 52, px: 1.75, fontSize: 14, fontWeight: on ? 700 : 500, whiteSpace: "nowrap", color: on ? tokens.color.primary : tokens.color.textMuted, borderBottom: `2px solid ${on ? tokens.color.primary : "transparent"}` }}
            >
              {t.label}
              {count !== undefined && (
                <Box component="span" sx={{ minWidth: 22, px: 0.75, fontSize: 12, lineHeight: "20px", fontWeight: 700, borderRadius: "10px", color: on ? "#fff" : tokens.color.textMuted, bgcolor: on ? tokens.color.primary : tokens.color.muted }}>
                  {count}
                </Box>
              )}
            </ButtonBase>
          );
        })}
      </Box>

      {tab === "preparing" ? (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {vm.error && <ToastAlert severity="error" sx={{ mb: 2 }}>{vm.error}</ToastAlert>}
          <Box sx={{ display: "grid", gap: 2, alignItems: "start", gridTemplateColumns: { xs: "1fr", md: "300px minmax(0, 1fr)" } }}>
            <GroupOrderList
              orders={working}
              openKey={chosen?.key}
              onOpen={setChosenKey}
              search={search}
              onSearch={setSearch}
              now={tick}
              own={handlers.own}
            />
            <GroupOrderPanel order={chosen} now={tick} busy={!!chosen && vm.busyKey === chosen.key} {...handlers} />
          </Box>
        </Box>
      ) : (
        <Box sx={{ maxWidth: 760, mx: "auto", p: { xs: 2, md: 3 }, display: "grid", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, borderRadius: "10px", color: tokens.color.info, bgcolor: tokens.color.infoBg }}>
            <InfoOutlined sx={{ fontSize: 17 }} />
            <Typography sx={{ fontSize: 13 }}>
              Group orders are assigned to you by the TrainDhaba team. Call support if you can&apos;t take one.
            </Typography>
          </Box>
          {vm.error && <ToastAlert severity="error">{vm.error}</ToastAlert>}
          {shown.length ? (
            shown.map((order) => (
              <GroupOrderTile
                key={order.key}
                order={order}
                now={vm.now}
                busy={vm.busyKey === order.key}
                onOpen={() => setOpenKey(order.key)}
                {...handlers}
              />
            ))
          ) : (
            <Box sx={{ display: "grid", placeItems: "center", gap: 1, minHeight: 220, color: tokens.color.textMuted }}>
              <InboxOutlined sx={{ fontSize: 44, opacity: 0.5 }} />
              <Typography>{vm.loading ? "Loading group orders…" : current.empty}</Typography>
            </Box>
          )}
        </Box>
      )}

      <GroupOrderDrawer
        order={open}
        now={vm.now}
        busy={!!open && vm.busyKey === open.key}
        onClose={() => setOpenKey(null)}
        {...handlers}
      />
    </Box>
  );
}
