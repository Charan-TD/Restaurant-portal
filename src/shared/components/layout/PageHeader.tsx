import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
export interface PageHeaderProps {
  /** Small trail above the title, e.g. "Orders / Live orders". */
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 2,
        mb: 4,
      }}
    >
      <div>
        {eyebrow && (
          <Typography
            variant="overline"
            color="primary.dark"
            sx={{ letterSpacing: 1.2, fontWeight: 700 }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            {subtitle}
          </Typography>
        )}
      </div>
      {actions}
    </Box>
  );
}
