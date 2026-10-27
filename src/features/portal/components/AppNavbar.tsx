"use client";
import { useState } from "react";
import NextLink from "next/link";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import { usePortal } from "@/core/providers/PortalProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useSearchOrdersQuery } from "@/features/dashboard/services/orderApi";
import { useSearchCustomersQuery } from "@/features/customers/services/customerApi";
import { useSearchMenuItemsQuery } from "@/features/menu/services/menuItemApi";
import { searchablePages } from "@/core/constants/navigation";
import {
  UniversalSearch,
  type SearchOption,
} from "@/shared/components/navigation/UniversalSearch";
import { NotificationsMenu } from "./NotificationsMenu";
import { OnlineToggle } from "./OnlineToggle";
import { ProfileMenu } from "./ProfileMenu";
import type { PortalShellViewModel } from "../viewmodels/usePortalShellViewModel";
/** A greeting for the time of day. */
const wish = (hour = new Date().getHours()) =>
  hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
export function AppNavbar({ vm }: { vm: PortalShellViewModel }) {
  const router = useRouter(),
    { orders } = usePortal(),
    alerts = vm.notifications;
  const [typed, setTyped] = useState(""),
    term = useDebouncedValue(typed.trim()),
    // Orders, customers and items are searched by the server as the vendor types.
    active = !DEMO_MODE && term.length >= 2 && typed.trim().length >= 2,
    foundOrders = useSearchOrdersQuery({ q: term, page: 1 }, { skip: !active }),
    foundCustomers = useSearchCustomersQuery(term, { skip: !active }),
    foundItems = useSearchMenuItemsQuery(term, { skip: !active }),
    searching =
      typed.trim().length >= 2 &&
      (typed.trim() !== term ||
        foundOrders.isFetching ||
        foundCustomers.isFetching ||
        foundItems.isFetching);
  const remote: SearchOption[] = active
    ? [
        ...(foundOrders.data?.orders ?? []).slice(0, 5).map((o) => ({
          label: `${o.id} · ${o.customer ?? o.food}`,
          href: "/orders/all",
          group: "Orders",
          remote: true,
        })),
        ...(foundCustomers.data ?? []).slice(0, 5).map((c) => ({
          label: [c.name, c.phone].filter(Boolean).join(" · ") || "Customer",
          href: "/customers/list",
          group: "Customers",
          remote: true,
        })),
        ...(foundItems.data ?? []).slice(0, 5).map((i) => ({
          label: i.name,
          href: `/menu/items/${encodeURIComponent(i.id)}`,
          group: "Menu items",
          remote: true,
        })),
      ]
    : [];
  const searchOptions: SearchOption[] = [
    ...searchablePages,
    ...(DEMO_MODE
      ? orders.map((o) => ({
          label: `${o.id} · ${o.food}`,
          href: "/orders/all",
          group: "Orders",
        }))
      : []),
    ...remote,
  ];
  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ bgcolor: "transparent" }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 60, md: 64 },
          gap: { xs: 0.25, sm: 1, md: 2 },
          px: { xs: 1, sm: 3 },
        }}
      >
        <Tooltip title="Open menu">
          <IconButton
            aria-label="Open menu"
            onClick={vm.toggleMobile}
            sx={{ display: { md: "none" } }}
          >
            <MenuOutlined />
          </IconButton>
        </Tooltip>
        <Box sx={{ display: { xs: "none", md: "block" }, flexShrink: 0 }}>
          <Typography
            noWrap
            sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}
          >
            {wish()}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Typography>
        </Box>
        <UniversalSearch
          options={searchOptions}
          onQuery={setTyped}
          loading={searching}
          onSelect={(option) => router.push(option.href)}
        />
        <Box sx={{ display: { xs: "none", sm: "flex" } }}>
          <OnlineToggle
            online={vm.vendor.online}
            onChange={vm.vendor.setOnline}
            size="small"
          />
        </Box>
        <Tooltip title="Go to your menu items">
          <Button
            component={NextLink}
            href="/menu/items"
            variant="outlined"
            size="small"
            startIcon={<RestaurantMenuOutlined />}
            sx={{ display: { xs: "none", sm: "inline-flex" }, flexShrink: 0 }}
          >
            Items
          </Button>
        </Tooltip>
        <NotificationsMenu vm={alerts} />
        <ProfileMenu vm={vm} />
      </Toolbar>
    </AppBar>
  );
}
