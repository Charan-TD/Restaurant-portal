"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { tokenScopeSx } from "@/core/theme/tokens";
import { PortalHeader } from "./PortalHeader";
import { SetupSidebar } from "./SetupSidebar";

/**
 * The registration screens: header on top, then the setup list beside the
 * current step. The status page after submitting has no list.
 */
export function PortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    setup = pathname === "/register",
    // Only the status screen shares the login screen's background.
    status = pathname === "/status";
  return (
    <Box
      sx={{
        ...tokenScopeSx,
        position: "relative",
        minHeight: "100vh",
        background: status
          ? "linear-gradient(160deg, #fff7f1 0%, #fff1e6 55%, #ffe9da 100%)"
          : "#f4f5f7",
      }}
    >
      {status && (
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: "url(/login-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      )}
      <Box sx={{ position: "relative" }}>
        <PortalHeader />
      </Box>
      <Box
        sx={{
          position: "relative",
          maxWidth: setup ? 1200 : 820,
          mx: "auto",
          px: { xs: 2, md: 3 },
          py: { xs: 3, md: 4 },
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: setup
            ? { xs: "1fr", md: "300px minmax(0, 1fr)" }
            : "1fr",
        }}
      >
        {setup && <SetupSidebar />}
        <Box component="main" sx={{ minWidth: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
