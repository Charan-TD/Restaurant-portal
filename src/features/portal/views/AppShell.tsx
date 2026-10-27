"use client";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Drawer, ThemeProvider } from "@mui/material";
import { portalTheme } from "@/core/theme/theme";
import { sidebarSections } from "@/core/constants/navigation";
import {
  AppSidebar,
  SIDEBAR_WIDTH,
} from "@/shared/components/layout/AppSidebar";
import { BackButton } from "@/shared/components/actions/BackButton";
import { AppNavbar } from "../components/AppNavbar";
import { usePortalShellViewModel } from "../viewmodels/usePortalShellViewModel";
const paperSx = {
  width: SIDEBAR_WIDTH,
  boxSizing: "border-box",
  borderRight: 1,
  borderColor: "divider",
} as const;
export function AppShell({ children }: { children: ReactNode }) {
  const vm = usePortalShellViewModel(),
    pathname = usePathname(),
    router = useRouter();
  if (!vm.authenticated) return null; // Redirecting to /login.
  const sidebar = (
    <AppSidebar
      sections={sidebarSections}
      pathname={pathname}
      restaurantName={vm.restaurantName}
      onNavigate={(href) => {
        vm.closeMobile();
        router.push(href);
      }}
      onLogout={vm.logout}
    />
  );
  return (
    <ThemeProvider theme={portalTheme}>
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
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
              "& .MuiDrawer-paper": {
                ...paperSx,
                overflowX: "hidden",
              },
            }}
          >
            {sidebar}
          </Drawer>
          <Drawer
            variant="permanent"
            open
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                ...paperSx,
                overflowX: "hidden",
              },
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
              maxWidth: 1680,
              mx: "auto",
              px: { xs: 2, sm: 2.5, md: 3 },
              py: { xs: 2.5, md: 3 },
            }}
          >
            <BackButton />
            {children}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
