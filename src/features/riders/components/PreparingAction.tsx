"use client";
import { Box, Button, Typography } from "@mui/material";
import TwoWheelerOutlined from "@mui/icons-material/TwoWheelerOutlined";
import { Hint } from "@/shared/components/feedback/Hint";
import { CommonButton } from "@/shared/components/actions/CommonButton";

const caption = { fontSize: 12.5 } as const;
/**
 * The action for an order being prepared. With the restaurant's own riders a
 * rider must be assigned first; only then can the order be marked ready. With
 * TrainDhaba riders the search started when the order was accepted, so the
 * food only has to be marked ready.
 */
export function PreparingAction({
  rider,
  busy,
  onAssign,
  onReady,
  trainDhabaRiders,
}: {
  rider?: { name: string; phone?: string };
  busy?: boolean;
  /** Opens the rider picker. */
  onAssign: () => void;
  onReady: () => void;
  /** Set for restaurants that use TrainDhaba riders. */
  trainDhabaRiders?: boolean;
}) {
  if (trainDhabaRiders)
    return (
      <Box sx={{ flex: 1, display: "grid", gap: 0.5 }}>
        <Hint title="The food is ready for the TrainDhaba rider to pick up">
          <CommonButton disabled={busy} variant="contained" onClick={onReady}>
            Mark as ready
          </CommonButton>
        </Hint>
        <Typography
          noWrap
          color="text.secondary"
          title={rider?.phone}
          sx={caption}
        >
          {rider
            ? `Rider assigned: ${rider.name}`
            : "Searching for a TrainDhaba rider…"}
        </Typography>
      </Box>
    );
  if (!rider)
    return (
      <Box sx={{ flex: 1, display: "grid", gap: 0.5 }}>
        <Hint title="Assign a rider before the order can be marked ready">
          <CommonButton
            disabled={busy}
            variant="contained"
            startIcon={<TwoWheelerOutlined />}
            onClick={onAssign}
          >
            Assign rider
          </CommonButton>
        </Hint>
        <Typography color="text.secondary" sx={caption}>
          Needed before it is ready
        </Typography>
      </Box>
    );
  return (
    <Box sx={{ flex: 1, display: "grid", gap: 0.5 }}>
      <Hint title={`The food is ready for ${rider.name} to pick up`}>
        <CommonButton disabled={busy} variant="contained" onClick={onReady}>
          Mark as ready
        </CommonButton>
      </Hint>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}
      >
        <Typography
          noWrap
          color="text.secondary"
          title={rider.phone}
          sx={caption}
        >
          Rider assigned: {rider.name}
        </Typography>
        <Button
          size="small"
          disabled={busy}
          onClick={onAssign}
          sx={{
            minWidth: 0,
            minHeight: 0,
            p: 0,
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          Change
        </Button>
      </Box>
    </Box>
  );
}
