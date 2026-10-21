import { Box, Chip, Stack, Typography } from "@mui/material";
import { isLowStock, type MenuItem } from "../models/menuItem";
/**
 * Low stock and TrainDhaba-disabled badges (stock itself has its own switch).
 * A disabled item also shows the reason the admin gave, in plain sight.
 */
export function MenuItemStatus({ item }: { item: MenuItem }) {
  const disabled = item.adminAvailable === false;
  return (
    <Box>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ flexWrap: "wrap", rowGap: 0.75 }}
      >
        {item.adminAvailable === false && (
          <Chip size="small" color="error" label="Disabled by TrainDhaba" />
        )}
        {item.available && isLowStock(item) && (
          <Chip
            size="small"
            color="warning"
            variant="outlined"
            label={`Low stock · ${item.quantity} left`}
          />
        )}
      </Stack>
      {disabled && (
        <Typography
          variant="body2"
          color="error.main"
          sx={{ mt: 0.75, fontWeight: 600, overflowWrap: "anywhere" }}
        >
          Reason: {item.adminInactiveReason || "No reason was given."}
        </Typography>
      )}
    </Box>
  );
}
