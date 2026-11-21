"use client";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, ButtonBase, Drawer, ThemeProvider, Typography } from "@mui/material";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import { useNewOrderAlerts } from "@/features/notifications/viewmodels/useNewOrderAlerts";
import { portalTheme } from "@/core/theme/theme";
import { tokens } from "@/core/theme/tokens";
import { railItems } from "@/core/constants/navigation";
import {
  AppSidebar,
  SIDEBAR_WIDTH,
} from "@/shared/components/layout/AppSidebar";
import { BackButton } from "@/shared/components/actions/BackButton";
import { isRedesignedPath } from "@/shared/components/actions/redesignedPaths";
import { useRidersOwner } from "@/features/riders/viewmodels/useRidersOwner";
import { AppNavbar } from "../components/AppNavbar";
import { usePortalShellViewModel } from "../viewmodels/usePortalShellViewModel";
const paperSx = {
  width: SIDEBAR_WIDTH,
  boxSizing: "border-box",
  borderRight: `1px solid ${tokens.color.border}`,
} as const;
export function AppShell({ children }: { children: ReactNode }) {
  const vm = usePortalShellViewModel(),
    // New orders ring on every page, not only the Orders screen.
    alerts = useNewOrderAlerts(),
    pathname = usePathname(),
    router = useRouter(),
    { ownRiders } = useRidersOwner(),
    // Only restaurants with their own riders manage riders; for TrainDhaba's
    // riders (or until the server says which) the section stays hidden.
    items = ownRiders ? railItems : railItems.filter((i) => i.id !== "riders");
  if (!vm.authenticated) return null; // Redirecting to /login.
  const sidebar = (
    <AppSidebar
      items={items}
      pathname={pathname}
      badges={{ orders: vm.ordersInProgress }}
      onNavigate={(href) => {
        vm.closeMobile();
        router.push(href);
      }}
    />
  );
  return (
    <ThemeProvider theme={portalTheme}>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: tokens.color.page,
        }}
      >
        <Box
          component="aside"
          sx={{
            width: { md: SIDEBAR_WIDTH },
            flexShrink: 0,
          }}
        >
          <Drawer
            variant="temporary"
            open={vm.mobileOpen}
            onClose={vm.closeMobile}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": { ...paperSx, overflowX: "hidden" },
            }}
          >
            {sidebar}
          </Drawer>
          <Drawer
            variant="permanent"
            open
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": { ...paperSx, overflowX: "hidden" },
            }}
          >
            {sidebar}
          </Drawer>
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AppNavbar vm={vm} />
          <Box
            component="main"
            className="portal-main"
            sx={{
              flex: 1,
              width: "100%",
              // The redesigned screens place their own margins.
              ...(isRedesignedPath(pathname)
                ? {}
                : { px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 3 } }),
            }}
          >
            <BackButton />
            {children}
          </Box>
        </Box>
      </Box>
      {/* Browsers keep a page silent until it is tapped once; until then, ask. */}
      {alerts.needsTap && (
        <Box
          role="status"
          sx={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            maxWidth: "calc(100vw - 32px)",
            px: 2,
            py: 1.25,
            borderRadius: "12px",
            color: "#fff",
            bgcolor: tokens.color.text,
            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
          }}
        >
          <NotificationsActiveOutlined sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            Turn on sound to hear new orders.
          </Typography>
          <ButtonBase
            onClick={() => void alerts.enableSound()}
            sx={{ px: 1.5, height: 32, flexShrink: 0, borderRadius: "8px", fontSize: 13, fontWeight: 700, color: tokens.color.text, bgcolor: "#fff" }}
          >
            Turn on
          </ButtonBase>
        </Box>
      )}
    </ThemeProvider>
  );
}
