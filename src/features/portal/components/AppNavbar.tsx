"use client";
import { useRouter } from "next/navigation";
import { AppBar, Box, IconButton, Toolbar } from "@mui/material";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import { usePortal } from "@/core/providers/PortalProvider";
import { navbarMenus, searchablePages } from "@/core/constants/navigation";
import type { AlertSource } from "@/features/notifications/models/notification";
import { NavDropdown } from "@/shared/components/navigation/NavDropdown";
import { UniversalSearch } from "@/shared/components/navigation/UniversalSearch";
import { navIcons } from "@/shared/components/navigation/navIcons";
import { NotificationsMenu } from "./NotificationsMenu";
import { OnlineToggle } from "./OnlineToggle";
import { ProfileMenu } from "./ProfileMenu";
import type { PortalShellViewModel } from "../viewmodels/usePortalShellViewModel";
export function AppNavbar({ vm }: { vm: PortalShellViewModel }) {
  const router = useRouter(),
    { orders } = usePortal(),
    alerts = vm.notifications;
  const searchOptions = [
    ...searchablePages,
    ...orders.map((o) => ({
      label: `${o.id} · ${o.food}`,
      href: "/orders/all",
      group: "Orders",
    })),
  ];
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "rgba(255, 255, 255, 0.86)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64, md: 72 },
          gap: { xs: 0.25, sm: 1, md: 2 },
          px: { xs: 1, sm: 3 },
        }}
      >
        <IconButton
          aria-label="Open menu"
          onClick={vm.toggleMobile}
          sx={{ display: { md: "none" } }}
        >
          <MenuOutlined />
        </IconButton>
        <UniversalSearch
          options={searchOptions}
          onSelect={(option) => router.push(option.href)}
        />
        <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {navbarMenus.map((menu) => {
            const source = menu.id as AlertSource;
            return (
              <NavDropdown
                key={menu.id}
                label={menu.label}
                icon={navIcons[menu.id]}
                pages={menu.pages}
                alert={alerts.hasAlert(source)}
                pageAlert={alerts.hasPageAlert}
                onClose={() => alerts.markSourceRead(source)}
              />
            );
          })}
        </Box>
        <Box sx={{ display: { xs: "none", sm: "flex" } }}>
          <OnlineToggle
            online={vm.vendor.online}
            onChange={vm.vendor.setOnline}
            size="small"
          />
        </Box>
        <NotificationsMenu vm={alerts} />
        <ProfileMenu vm={vm} />
      </Toolbar>
    </AppBar>
  );
}
