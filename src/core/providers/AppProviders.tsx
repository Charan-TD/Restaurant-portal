"use client";
import type { ReactNode } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { StoreProvider } from "@/core/store/StoreProvider";
import { theme } from "@/core/theme/theme";
import { PortalProvider } from "./PortalProvider";
import { ToastProvider } from "./ToastProvider";
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <StoreProvider>
          <ToastProvider>
            <PortalProvider>{children}</PortalProvider>
          </ToastProvider>
        </StoreProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
