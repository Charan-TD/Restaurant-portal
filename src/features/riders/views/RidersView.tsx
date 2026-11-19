"use client";
import { useState } from "react";
import { Avatar, Box, IconButton, Menu, MenuItem, Typography } from "@mui/material";
import MoreVert from "@mui/icons-material/MoreVert";
import { ToggleSwitch } from "@/shared/components/form/ToggleSwitch";
import {
  riderStatus,
  type Rider,
  type RiderStatus,
} from "../models/rider";
import { useRiderDuty } from "../viewmodels/useRiderDuty";
import TwoWheelerOutlined from "@mui/icons-material/TwoWheelerOutlined";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { cardHeaderSx, cardSx, tokens } from "@/core/theme/tokens";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { StatTile } from "@/shared/components/layout/StatTile";
import { CountTabs } from "@/shared/components/navigation/CountTabs";
import { AddRiderPanel } from "../components/AddRiderPanel";
import { useRidersViewModel } from "../viewmodels/useRidersViewModel";
import { useRidersOwner } from "../viewmodels/useRidersOwner";
/** The riders the restaurant has added. */
export function RidersView() {
  const { ownRiders, trainDhabaRiders } = useRidersOwner();
  if (ownRiders) return <OwnRidersView />;
  // Still checking with the server which kind of restaurant this is.
  if (!trainDhabaRiders)
    return (
      <PageHeader
        eyebrow="Riders"
        title="Riders"
        subtitle="Checking how your orders are delivered…"
      />
    );
  // TrainDhaba's riders: reached only by its address, as the menu hides it.
  return (
    <>
      <PageHeader
        eyebrow="Riders"
        title="Riders"
        subtitle="TrainDhaba's riders deliver your orders."
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          py: 6,
          textAlign: "center",
        }}
      >
        <TwoWheelerOutlined color="disabled" sx={{ fontSize: 48 }} />
        <Typography variant="h6">You don&apos;t need to add riders</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 440 }}>
          Your restaurant uses TrainDhaba riders. When an order is being
          prepared, use Search for rider in Live orders and a TrainDhaba rider
          will collect it.
        </Typography>
      </Box>
    </>
  );
}
const BADGES: Record<RiderStatus, { label: string; fg: string; bg: string }> = {
  available: {
    label: "Available",
    fg: tokens.color.success,
    bg: tokens.color.successBg,
  },
  delivering: { label: "On a delivery", fg: "#8a5a00", bg: "#fff4d6" },
  off: { label: "Off duty", fg: tokens.color.textMuted, bg: tokens.color.muted },
};
function StatusBadge({ status }: { status: RiderStatus }) {
  const b = BADGES[status];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        px: 1,
        py: "3px",
        borderRadius: tokens.radius.badge,
        fontSize: 11,
        lineHeight: "14px",
        fontWeight: 700,
        letterSpacing: "0.4px",
        textTransform: "uppercase",
        color: b.fg,
        bgcolor: b.bg,
      }}
    >
      {b.label}
    </Box>
  );
}
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
const tableSx = {
  width: "100%",
  borderCollapse: "collapse",
  "& th": {
    textAlign: "left",
    px: 3,
    py: 1.25,
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: 600,
    letterSpacing: "0.3px",
    textTransform: "uppercase",
    color: tokens.color.textMuted,
    bgcolor: tokens.color.sunken,
    borderTop: `1px solid ${tokens.color.borderSubtle}`,
  },
  "& td": {
    px: 3,
    py: 1.5,
    borderTop: `1px solid ${tokens.color.borderSubtle}`,
  },
} as const;
type RiderTab = "all" | RiderStatus;
/** The restaurant's own riders in a table, with the Add rider card beside it. */
function OwnRidersView() {
  const vm = useRidersViewModel(),
    duty = useRiderDuty(),
    [tab, setTab] = useState<RiderTab>("all"),
    [menu, setMenu] = useState<{ el: HTMLElement; rider: Rider }>(),
    rows = vm.riders.map((rider) => {
      const on = duty.isOnDuty(rider);
      return { rider, on, status: riderStatus(rider, on) };
    }),
    count = (s: RiderStatus) => rows.filter((r) => r.status === s).length,
    shown = tab === "all" ? rows : rows.filter((r) => r.status === tab),
    onDuty = rows.filter((r) => r.on),
    first = (n: string) => n.split(/\s+/)[0],
    known = vm.riders.filter((r) => r.deliveriesToday !== undefined),
    dutyNote = onDuty
      .map(
        (r) =>
          `${first(r.rider.name)}${r.status === "delivering" ? " on a delivery" : r.status === "available" ? " free" : ""}`,
      )
      .join(" · ");
  return (
    <ScreenSurface>
      <CountTabs
        label="Riders"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "all", label: "All riders", count: rows.length },
          { id: "available", label: "Available", count: count("available") },
          {
            id: "delivering",
            label: "On a delivery",
            count: count("delivering"),
          },
          { id: "off", label: "Off duty", count: count("off") },
        ]}
      />
      {vm.error && (
        <ToastAlert severity="error" sx={{ mt: 2 }}>
          {vm.error}
        </ToastAlert>
      )}
      <Box
        sx={{
          mt: 2.5,
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" },
        }}
      >
        <Box sx={{ display: "grid", gap: 2.5 }}>
          <Box
            sx={{
              display: "grid",
              gap: 2.5,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            }}
          >
            <StatTile
              label="On duty now"
              value={rows.length ? `${onDuty.length} of ${rows.length}` : "—"}
              note={dutyNote || undefined}
            />
            <StatTile
              label="Deliveries today"
              value={
                known.length
                  ? known.reduce((n, r) => n + (r.deliveriesToday ?? 0), 0)
                  : "—"
              }
              note="All reached the train on time"
            />
            <StatTile
              label="Avg handover"
              value="—"
              note="Pickup at counter to coach"
            />
          </Box>
          <Box sx={{ ...cardSx, overflow: "hidden" }}>
            <Box sx={{ ...cardHeaderSx, borderBottom: 0 }}>
              <Typography className="title" component="span">
                My riders
              </Typography>
              <Typography
                className="subtitle"
                component="span"
                sx={{ ml: 1.5 }}
              >
                Turn a rider off when they leave for the day
              </Typography>
            </Box>
            {shown.length ? (
              <Box component="table" sx={tableSx}>
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Status</th>
                    <th>Today</th>
                    <th>On duty</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {shown.map(({ rider, on, status }) => (
                    <tr key={rider.id}>
                      <td>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                        >
                          <Avatar
                            src={rider.photoUrl}
                            alt={rider.name}
                            sx={{
                              width: 36,
                              height: 36,
                              fontSize: 13,
                              fontWeight: 700,
                              color: tokens.color.text,
                              bgcolor: tokens.color.muted,
                            }}
                          >
                            {initials(rider.name)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              noWrap
                              sx={{
                                fontWeight: 600,
                                fontSize: 15,
                                lineHeight: "20px",
                              }}
                            >
                              {rider.name}
                            </Typography>
                            <Typography
                              sx={{ fontSize: 13, color: tokens.color.textMuted }}
                            >
                              {COUNTRY_CODE} {rider.phone}
                            </Typography>
                          </Box>
                        </Box>
                      </td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {rider.deliveriesToday ?? "—"}
                      </td>
                      <td>
                        <ToggleSwitch
                          checked={on}
                          onChange={(_, v) => duty.setOnDuty(rider.id, v)}
                          slotProps={{
                            input: {
                              "aria-label": `${rider.name} on duty`,
                            },
                          }}
                        />
                      </td>
                      <td style={{ textAlign: "right", width: 56 }}>
                        <IconButton
                          size="small"
                          aria-label={`More for ${rider.name}`}
                          onClick={(e) =>
                            setMenu({ el: e.currentTarget, rider })
                          }
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  py: 6,
                  color: tokens.color.textSubtle,
                  borderTop: `1px solid ${tokens.color.borderSubtle}`,
                }}
              >
                <TwoWheelerOutlined sx={{ fontSize: 44, opacity: 0.5 }} />
                <Typography>
                  {vm.loading ? "Loading riders…" : "No riders added yet."}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <AddRiderPanel saving={vm.adding} onAdd={vm.addRider} />
      </Box>
      <Menu
        anchorEl={menu?.el}
        open={Boolean(menu)}
        onClose={() => setMenu(undefined)}
      >
        <MenuItem
          component="a"
          href={`tel:${COUNTRY_CODE}${menu?.rider.phone ?? ""}`}
          onClick={() => setMenu(undefined)}
        >
          Call rider
        </MenuItem>
      </Menu>
    </ScreenSurface>
  );
}
