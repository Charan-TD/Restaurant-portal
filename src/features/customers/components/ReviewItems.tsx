"use client";
import { useState } from "react";
import { Box, Dialog, DialogContent, Typography } from "@mui/material";
import { ItemsSummary } from "@/shared/components/feedback/ItemsSummary";
import { itemLabel, type ReviewItem } from "../models/review";

/** The items of one reviewed order; clicking them opens the full list in a popup. */
export function ReviewItems({
  orderId,
  items,
}: {
  orderId: string;
  items: ReviewItem[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Box
        role="button"
        tabIndex={0}
        title="View ordered items"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        sx={{
          cursor: "pointer",
          "&:hover .view": { textDecoration: "underline" },
        }}
      >
        <ItemsSummary items={items.map(itemLabel)} />
        <Typography
          className="view"
          sx={{ fontSize: 12.5, fontWeight: 600, color: "primary.main" }}
        >
          View items
        </Typography>
      </Box>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            onClick: () => setOpen(false),
            sx: { cursor: "pointer", borderRadius: 3, overflow: "hidden" },
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          <Typography sx={{ fontSize: 12, opacity: 0.85, fontWeight: 600 }}>
            ORDERED ITEMS
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 800 }}>
            {orderId}
          </Typography>
        </Box>
        <DialogContent sx={{ px: 3, pt: 2.5, pb: 2.5 }}>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {items.length ? (
              items.map((line, i) => (
                <Typography key={i} sx={{ fontWeight: 600 }}>
                  {itemLabel(line)}
                </Typography>
              ))
            ) : (
              <Typography color="text.secondary">No items listed.</Typography>
            )}
          </Box>
          <Typography
            sx={{
              mt: 2,
              textAlign: "center",
              fontSize: 12.5,
              color: "text.secondary",
            }}
          >
            Click anywhere to close
          </Typography>
        </DialogContent>
      </Dialog>
    </>
  );
}
