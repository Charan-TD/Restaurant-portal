"use client";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Drawer } from "@mui/material";
import { sidebarSections } from "@/core/constants/navigation";
import {
  AppSidebar,
  SIDEBAR_WIDTH,
} from "@/shared/components/layout/AppSidebar";
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
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Box
        component="aside"
        sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: 0 }}
      >
        <Drawer
          variant="temporary"
          open={vm.mobileOpen}
          onClose={vm.closeMobile}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": paperSx,
          }}
        >
          {sidebar}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": paperSx,
          }}
        >
          {sidebar}
        </Drawer>
      </Box>
      <Box
        sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
      >
        <AppNavbar vm={vm} />
        <Box
          component="main"
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: 1360,
            mx: "auto",
            px: { xs: 2, sm: 3, lg: 5 },
            py: { xs: 3, md: 4 },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
