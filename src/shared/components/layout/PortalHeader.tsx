import { Box, Typography } from "@mui/material";
import { tokens } from "@/core/theme/tokens";
import { BrandLogo } from "./BrandLogo";
import { HelpButton } from "./HelpButton";

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
      <Box sx={{ width: 72, height: 72, flexShrink: 0 }}>
        <BrandLogo size={72} radius={0} />
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
