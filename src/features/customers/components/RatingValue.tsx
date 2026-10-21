import { Box, Rating, Typography } from "@mui/material";
import Star from "@mui/icons-material/Star";

/** One orange star and the number, e.g. "★ 4.9". */
export function RatingValue({ rating }: { rating: number }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Star sx={{ color: "primary.main", fontSize: 24 }} />
      <Typography sx={{ fontWeight: 500 }}>{rating.toFixed(1)}</Typography>
    </Box>
  );
}

/** Five stars (rounded to whole stars) followed by the number. */
export function RatingStars({ rating }: { rating: number }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Rating
        readOnly
        size="small"
        value={Math.round(rating)}
        aria-label={`${rating.toFixed(1)} out of 5`}
        sx={{
          color: "primary.main",
          "& .MuiRating-iconEmpty": { color: "#d6dad6" },
        }}
      />
      <Typography sx={{ fontWeight: 500 }}>{rating.toFixed(1)}</Typography>
    </Box>
  );
}
