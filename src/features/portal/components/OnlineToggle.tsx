"use client";
import { Box, ButtonBase, Tooltip, Typography } from "@mui/material";
import { tokens } from "@/core/theme/tokens";
import { reopenLabel } from "../models/offline";
const OFF = "#c4c4c4";
/**
 * Lets the vendor pause or resume taking orders: a 40px green pill saying
 * Online, with a white knob that sits at the right while on.
 */
export function OnlineToggle({
  online,
  onChange,
  reopenAt,
  locked = false,
}: {
  online: boolean;
  onChange: (online: boolean) => void;
  /** When an offline restaurant comes back online by itself. */
  reopenAt?: Date | null;
  /** Not allowed to go online yet: the menu or riders are still to add. */
  locked?: boolean;
}) {
  const back = !online && reopenAt ? reopenLabel(reopenAt) : "";
  return (
    <Tooltip
      title={
        locked
          ? "Add your menu (and riders) first, then you can go online."
          : online
          ? "You are taking orders. Turn off to stop."
          : back
            ? `You are not taking orders. You reopen at ${back}, or turn on now.`
            : "You are not taking orders. Turn on to start."
      }
    >
      <ButtonBase
        role="switch"
        aria-checked={online}
        aria-label={
          online
            ? "Restaurant is online. Turn off to stop taking orders."
            : "Restaurant is offline. Turn on to start taking orders."
        }
        aria-disabled={locked}
        onClick={() => onChange(!online)}
        sx={{
          flexShrink: 0,
          height: 40,
          boxSizing: "border-box",
          gap: 1.5,
          pl: online ? 2 : "6px",
          pr: online ? "6px" : 2,
          flexDirection: online ? "row" : "row-reverse",
          borderRadius: "999px",
          color: "#fff",
          bgcolor: online ? tokens.color.success : OFF,
          transition: "background-color .2s",
          ...(locked ? { cursor: "not-allowed", opacity: 0.6 } : {}),
          "&.Mui-focusVisible": {
            outline: `2px solid ${tokens.color.info}`,
            outlineOffset: 2,
          },
        }}
      >
        <Box sx={{ textAlign: "left" }}>
          <Typography
            sx={{ fontSize: 15, fontWeight: 600, lineHeight: back ? "16px" : "22px" }}
          >
            {online ? "Online" : "Offline"}
          </Typography>
          {back && (
            <Typography sx={{ fontSize: 11, lineHeight: "12px" }}>
              Back {back}
            </Typography>
          )}
        </Box>
        <Box
          aria-hidden
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        />
      </ButtonBase>
    </Tooltip>
  );
}
