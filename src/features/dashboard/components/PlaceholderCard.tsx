import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { CommonCard } from "@/shared/components/layout/CommonCard";
interface Props {
  title: string;
  /** What this card will show once live data is connected. */
  description: string;
  icon: ReactNode;
  /** Height of the empty area that the real content will fill. */
  bodyHeight?: number;
}
/** A dashboard card's frame and purpose, shown until its data is wired up. */
export function PlaceholderCard({
  title,
  description,
  icon,
  bodyHeight = 0,
}: Props) {
  return (
    <CommonCard className="placeholder-card">
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            bgcolor: "action.hover",
            color: "primary.main",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <div>
          <Typography
            variant="subtitle1"
            component="h2"
            sx={{ fontWeight: 700, lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        </div>
      </Box>
      {bodyHeight > 0 && (
        <Box
          sx={{
            mt: 3,
            height: bodyHeight,
            borderRadius: "12px",
            border: "1px dashed",
            borderColor: "divider",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Data will appear here once your restaurant is live
          </Typography>
        </Box>
      )}
    </CommonCard>
  );
}
