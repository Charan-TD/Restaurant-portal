import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { tokens, tokenScopeSx } from "@/core/theme/tokens";

/**
 * The grey page under the top bar, with the design tokens applied to the
 * inputs and buttons inside. Content keeps the 24px page margin; a
 * `CountTabs` bar placed first reaches the edges instead.
 */
export function ScreenSurface({
  children,
  flush,
}: {
  children: ReactNode;
  /** No padding, for a screen whose own panels reach the edges. */
  flush?: boolean;
}) {
  return (
    <Box
      sx={{
        ...tokenScopeSx,
        bgcolor: tokens.color.page,
        px: flush ? 0 : { xs: 2, md: 3 },
        pt: flush ? 0 : { xs: 2, md: 3 },
        pb: flush ? 0 : 4,
        minHeight: "calc(100vh - 72px)",
      }}
    >
      {children}
    </Box>
  );
}
