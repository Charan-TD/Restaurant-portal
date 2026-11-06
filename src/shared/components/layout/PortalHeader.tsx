import { Box, Typography } from "@mui/material";
import { tokens } from "@/core/theme/tokens";
import { HelpButton } from "./HelpButton";

/** The train-in-a-pin mark, white on the orange tile. */
function PinMark() {
  return (
    <svg width="36" height="42" viewBox="0 0 40 48" aria-hidden>
      <path
        d="M20 0C9 0 0 8.7 0 19.5 0 31 12 40 20 48c8-8 20-17 20-28.5C40 8.7 31 0 20 0z"
        fill="#fff"
      />
      <rect x="11" y="8" width="18" height="22" rx="4" fill="#f26100" />
      <rect x="14" y="12" width="12" height="7" rx="1.5" fill="#fff" />
      <circle cx="15.5" cy="25" r="1.8" fill="#fff" />
      <circle cx="24.5" cy="25" r="1.8" fill="#fff" />
    </svg>
  );
}

/** The white bar on the registration screens: orange logo tile and the product name. */
export function PortalHeader() {
  return (
    <Box
      component="header"
      sx={{
        height: 72,
        display: "flex",
        alignItems: "center",
        bgcolor: tokens.color.card,
        borderBottom: `1px solid ${tokens.color.border}`,
      }}
    >
      <Box
        sx={{
          width: 88,
          height: 72,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: "#f26100",
        }}
      >
        <PinMark />
      </Box>
      <Box sx={{ ml: 2 }}>
        <Typography sx={{ fontSize: 18, lineHeight: "24px", fontWeight: 700 }}>
          TrainDhaba Partner
        </Typography>
        <Typography sx={{ fontSize: 13, lineHeight: "18px", color: tokens.color.textMuted }}>
          Restaurant registration
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }} />
      <Box sx={{ pr: { xs: 2, md: 3 } }}>
        <HelpButton />
      </Box>
    </Box>
  );
}
