import { Box, Typography } from "@mui/material";
import { cardHeaderSx } from "@/core/theme/tokens";

/** Heading shared by every section on the right of the profile. */
export function PaneHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <Box sx={cardHeaderSx}>
      <Typography className="title">{title}</Typography>
      <Typography className="subtitle">{subtitle}</Typography>
    </Box>
  );
}
