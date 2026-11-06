"use client";
import { usePathname } from "next/navigation";
import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import { pageTitleFor } from "@/core/constants/navigation";
import { tokens } from "@/core/theme/tokens";
import { GoOfflineDialog } from "./GoOfflineDialog";
import { NotificationsMenu } from "./NotificationsMenu";
import { OnlineToggle } from "./OnlineToggle";
import type { PortalShellViewModel } from "../viewmodels/usePortalShellViewModel";

/** The white bar on top: page title, the restaurant, the Online switch and alerts. */
export function AppNavbar({ vm }: { vm: PortalShellViewModel }) {
  const pathname = usePathname(),
    title = pageTitleFor(pathname),
    { restaurantName } = vm,
    { city } = vm.vendor;
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: tokens.color.card,
        borderBottom: `1px solid ${tokens.color.border}`,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 64, md: 72 },
          gap: 2,
          px: { xs: 1, sm: 3 },
          py: 1.5,
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
        <Typography
          component="h1"
          noWrap
          sx={{
            fontSize: 22,
            lineHeight: "28px",
            fontWeight: 700,
            color: tokens.color.text,
          }}
        >
          {title}
        </Typography>
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            gap: 1,
            minWidth: 0,
            pl: 2,
            height: 28,
            borderLeft: `1px solid ${tokens.color.border}`,
            fontSize: 14,
            color: tokens.color.textMuted,
          }}
        >
          <StorefrontOutlined sx={{ fontSize: 18 }} />
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, color: tokens.color.text }}>
            {restaurantName}
          </Typography>
          {city && <Box component="span" sx={{ whiteSpace: "nowrap" }}>· {city}</Box>}
        </Box>
        <Box sx={{ flex: 1 }} />
        {!vm.vendor.online && !vm.setup.ready && !vm.setup.loading && (
          <Typography
            sx={{ display: { xs: "none", md: "block" }, fontSize: 14, color: tokens.color.textMuted }}
          >
            Finish setup to go online
          </Typography>
        )}
        <OnlineToggle
          locked={!vm.vendor.online && !vm.setup.ready}
          online={vm.vendor.online}
          onChange={vm.toggleOnline}
          reopenAt={vm.reopenAt}
        />
        <GoOfflineDialog
          open={vm.offlineOpen}
          inProgress={vm.ordersInProgress}
          onClose={vm.closeOffline}
          onConfirm={(offline) => vm.vendor.setOnline(false, offline)}
        />
        <NotificationsMenu vm={vm.notifications} />
      </Toolbar>
    </AppBar>
  );
}
