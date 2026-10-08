"use client";
import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "@/core/theme/theme";
import { PortalProvider } from "./PortalProvider";
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PortalProvider>{children}</PortalProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
