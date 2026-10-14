import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { menuFoodTypes } from "../models/menuItem";
import type { FoodFilter } from "../viewmodels/useMenuItemsViewModel";
export function MenuFilters({
  search,
  onSearch,
  foodFilter,
  onFoodFilter,
}: {
  search: string;
  onSearch: (value: string) => void;
  foodFilter: FoodFilter;
  onFoodFilter: (value: FoodFilter) => void;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
        mb: 1,
      }}
    >
      <CommonTextField
        size="small"
        label="Search items"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        inputPrefix={<SearchOutlined fontSize="small" />}
        sx={{ flex: "1 1 220px", maxWidth: 360 }}
      />
      <ToggleButtonGroup
        exclusive
        size="small"
        value={foodFilter}
        onChange={(_, value) => value && onFoodFilter(value)}
        aria-label="Food type"
        sx={{
          "& .MuiToggleButton-root": {
            height: 40,
            px: 2,
            gap: 0.75,
            lineHeight: 1,
            "& .food-mark": { m: 0 },
          },
        }}
      >
        <ToggleButton value="All">All</ToggleButton>
        {menuFoodTypes.map((type) => (
          <ToggleButton key={type} value={type}>
            <FoodTypeMark type={type} />
            {type}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
