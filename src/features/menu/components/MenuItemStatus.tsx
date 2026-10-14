import { Chip, Stack } from "@mui/material";
import { isLowStock, type MenuItem } from "../models/menuItem";
/** Low stock and TrainDhaba-disabled badges (stock itself has its own switch). */
export function MenuItemStatus({ item }: { item: MenuItem }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
      {item.adminAvailable === false && (
        <Chip
          size="small"
          color="error"
          label="Disabled by TrainDhaba"
          title={item.adminInactiveReason || undefined}
        />
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
  );
}
