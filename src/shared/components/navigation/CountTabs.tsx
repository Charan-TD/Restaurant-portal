import type { ReactNode } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import { tokens } from "@/core/theme/tokens";

export interface CountTab<T extends string> {
  id: T;
  label: string;
  /** Left out, the tab shows no badge. */
  count?: number;
}

/**
 * A white bar of underlined tabs, each with a count badge beside its name.
 * `trailing` sits at the right end of the bar.
 */
export function CountTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  trailing,
}: {
  tabs: CountTab<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Names the tab row for screen readers. */
  label: string;
  trailing?: ReactNode;
}) {
  const { color } = tokens;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        px: { xs: 2, md: 3 },
        // Reaches the edges of the ScreenSurface it sits first in.
        mx: { xs: -2, md: -3 },
        mt: { xs: -2, md: -3 },
        mb: { xs: 2, md: 3 },
        bgcolor: color.card,
        borderBottom: `1px solid ${color.border}`,
      }}
    >
      <Tabs
        value={value}
        onChange={(_, id: T) => onChange(id)}
        aria-label={label}
        sx={{
          minHeight: 52,
          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: "3px 3px 0 0",
            bgcolor: color.primary,
          },
        }}
      >
        {tabs.map((tab) => {
          const active = value === tab.id;
          return (
            <Tab
              key={tab.id}
              value={tab.id}
              disableRipple
              sx={{
                minHeight: 52,
                minWidth: 0,
                px: 0,
                mr: 3,
                textTransform: "none",
                fontSize: 15,
                lineHeight: "22px",
                fontWeight: 600,
                color: color.textMuted,
                "&.Mui-selected": { color: color.primary },
              }}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {tab.label}
                  {tab.count !== undefined && (
                  <Box
                    component="span"
                    sx={{
                      minWidth: 22,
                      height: 22,
                      px: 0.75,
                      borderRadius: "999px",
                      fontSize: 12,
                      lineHeight: "22px",
                      fontWeight: 700,
                      textAlign: "center",
                      color: active ? "#fff" : color.textMuted,
                      bgcolor: active ? color.primary : color.muted,
                    }}
                  >
                    {tab.count}
                  </Box>
                  )}
                </Box>
              }
            />
          );
        })}
      </Tabs>
      {trailing && (
        <Box
          sx={{
            fontSize: 13,
            whiteSpace: "nowrap",
            color: color.textMuted,
            display: { xs: "none", md: "block" },
          }}
        >
          {trailing}
        </Box>
      )}
    </Box>
  );
}
