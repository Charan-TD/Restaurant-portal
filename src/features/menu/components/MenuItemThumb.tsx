import { Box } from "@mui/material";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import { menuImageUrl } from "../services/menuItemService";
/** First picture of the item, or a placeholder icon. */
export function MenuItemThumb({
  images,
  name,
  size = 56,
}: {
  images: string[];
  name: string;
  size?: number;
}) {
  const url = menuImageUrl(images[0]);
  return (
    <Box
      role="img"
      aria-label={name}
      className="menu-thumb"
      sx={{
        width: size,
        height: size,
        ...(url && { backgroundImage: `url("${url}")` }),
      }}
    >
      {!url && <RestaurantMenuOutlined />}
    </Box>
  );
}
