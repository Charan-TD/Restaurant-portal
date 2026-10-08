import { Box, Typography } from "@mui/material";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { formatRupees } from "@/shared/utils/format";
import type { TopItem } from "../models/dashboard";
export function TopItems({ items }: { items: TopItem[] }) {
  return (
    <CommonCard>
      <Typography variant="h6" component="h2">
        Top items today
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Best sellers so far
      </Typography>
      <Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, mt: 2 }}>
        {items.map((item, i) => (
          <Box
            component="li"
            key={item.name}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              py: 1.5,
              borderTop: i ? 1 : 0,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                fontWeight: 700,
                bgcolor: "action.hover",
                color: "text.secondary",
                flexShrink: 0,
              }}
            >
              {i + 1}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {item.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatRupees(item.revenue)}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {item.sold} sold
            </Typography>
          </Box>
        ))}
      </Box>
    </CommonCard>
  );
}
