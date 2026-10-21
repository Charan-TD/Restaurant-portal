import { Box, Chip, Tooltip, Typography } from "@mui/material";

/**
 * The first few items of an order, then a "+N more" pill for the rest.
 * Hovering the pill lists everything that was ordered.
 */
export function ItemsSummary({
  items,
  visible = 2,
}: {
  items: string[];
  /** How many items are named before the rest collapse into "+N more". */
  visible?: number;
}) {
  if (items.length === 0) return <Typography color="text.secondary">–</Typography>;
  const shown = items.slice(0, visible),
    hidden = items.length - shown.length;
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        columnGap: 1,
        rowGap: 0.5,
      }}
    >
      <Typography component="span" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
        {shown.join(", ")}
      </Typography>
      {hidden > 0 && (
        <Tooltip title={items.join(", ")} arrow>
          <Chip
            size="small"
            label={`+${hidden} more`}
            sx={{
              height: 24,
              fontWeight: 600,
              color: "primary.dark",
              bgcolor: "#fff1e8",
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
}
