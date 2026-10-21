import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

/** A value under its heading, like the columns of the live orders list. */
export function InfoCell({
  value,
  caption,
  strong,
  first,
  sx,
}: {
  value: ReactNode;
  /** Heading above the value; leave out for a name that needs none. */
  caption?: string;
  strong?: boolean;
  first?: boolean;
  sx?: object;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        ...(!first && {
          borderLeft: { lg: 1 },
          borderColor: "divider",
          pl: { lg: 2.5 },
        }),
        ...sx,
      }}
    >
      {caption && (
        <Typography variant="body2" sx={{ mb: 0.25 }} color="text.secondary">
          {caption}
        </Typography>
      )}
      <Typography
        component="div"
        sx={{ fontWeight: strong ? 800 : 600, lineHeight: 1.35 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/** The card shell the live orders rows use. */
export const rowSx = (columns: string) =>
  ({
    display: "grid",
    alignItems: "center",
    gap: { xs: 1.5, lg: 2.5 },
    p: 2,
    borderRadius: "14px",
    border: 1,
    borderColor: "divider",
    bgcolor: "background.paper",
    boxShadow:
      "0 1px 2px rgba(16, 24, 40, 0.06), 0 6px 16px rgba(16, 24, 40, 0.07)",
    transition: "box-shadow .2s ease, transform .2s ease",
    "&:hover": {
      boxShadow:
        "0 2px 4px rgba(16, 24, 40, 0.08), 0 12px 26px rgba(16, 24, 40, 0.12)",
      transform: "translateY(-1px)",
    },
    gridTemplateColumns: {
      xs: "repeat(2, minmax(0, 1fr))",
      lg: columns,
    },
  }) as const;
