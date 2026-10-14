import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { CommonCard } from "@/shared/components/layout/CommonCard";
/** A profile card: orange icon tile, title, optional subtitle and content. */
export function ProfileSection({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <CommonCard className="profile-card">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.75, mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(242,106,46,.1)",
            color: "primary.main",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" component="h2" sx={{ lineHeight: 1.3 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </CommonCard>
  );
}
/** A label above a value, with an optional icon tile; empty values show "Not added". */
export function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon?: ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
      {icon && (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(242,106,46,.08)",
            color: "text.primary",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          sx={{ fontWeight: value ? 600 : 400, overflowWrap: "anywhere" }}
          color={value ? "text.primary" : "text.disabled"}
        >
          {value || "Not added"}
        </Typography>
      </Box>
    </Box>
  );
}
/** Fields in two columns, with a divider between them on wide screens. */
export function FieldGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        rowGap: 3,
        columnGap: 0,
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
        "& > :nth-of-type(odd)": { pr: { sm: 4 } },
        "& > :nth-of-type(even)": {
          pl: { sm: 4 },
          borderLeft: { sm: 1 },
          borderColor: "divider",
        },
      }}
    >
      {children}
    </Box>
  );
}
