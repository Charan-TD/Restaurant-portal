"use client";
import { Box, Chip, Typography } from "@mui/material";

/**
 * An order's status as a chip, with who has it underneath. Shown where the
 * restaurant has nothing left to do: closed orders, the all orders lists, and
 * orders a TrainDhaba rider takes over once they are ready.
 */
export function DeliveryStatus({
  label,
  color = "default",
  rider,
  note,
}: {
  label: string;
  color?: "default" | "success" | "error" | "info";
  rider?: { name: string; phone?: string };
  /** Shown instead of the rider line, e.g. "Waiting for a rider to pick it up". */
  note?: string;
}) {
  const line = note ?? (rider && `Rider: ${rider.name}`);
  return (
    <Box
      sx={{
        flex: 1,
        display: "grid",
        gap: 0.5,
        justifyItems: "start",
        minWidth: 0,
      }}
    >
      <Chip size="small" variant="outlined" color={color} label={label} />
      {line && (
        <Typography
          noWrap
          color="text.secondary"
          title={rider?.phone}
          sx={{ fontSize: 12.5, maxWidth: "100%" }}
        >
          {line}
        </Typography>
      )}
    </Box>
  );
}
/** What a TrainDhaba restaurant sees once the rider has the order in hand. */
export function trainDhabaNote(
  step: "ready" | "pickedUp",
  rider?: { name: string },
) {
  if (step === "ready")
    return rider
      ? `${rider.name} will pick it up`
      : "Waiting for a TrainDhaba rider";
  return rider
    ? `Picked up by ${rider.name}`
    : "Picked up by the TrainDhaba rider";
}
