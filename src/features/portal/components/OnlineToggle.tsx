"use client";
import { Box, Switch, Tooltip, Typography } from "@mui/material";
const ONLINE = "#2e7d32",
  OFFLINE = "#9aa19c";
/** Lets the vendor pause or resume taking orders. */
export function OnlineToggle({
  online,
  onChange,
  size = "medium",
}: {
  online: boolean;
  onChange: (online: boolean) => void;
  size?: "small" | "medium";
}) {
  return (
    <Box
      component="label"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        pl: 1.5,
        pr: 0.5,
        borderRadius: 999,
        border: 1,
        borderColor: online ? "rgba(46,125,50,.35)" : "divider",
        bgcolor: online ? "rgba(46,125,50,.08)" : "transparent",
        cursor: "pointer",
        userSelect: "none",
        transition: "background-color .15s, border-color .15s",
      }}
    >
      <Box
        aria-hidden
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: online ? ONLINE : OFFLINE,
          boxShadow: online ? `0 0 0 3px rgba(46,125,50,.18)` : "none",
        }}
      />
      <Typography
        variant="body2"
        sx={{
          ml: 0.5,
          fontWeight: 600,
          minWidth: 46,
          color: online ? ONLINE : "text.secondary",
        }}
      >
        {online ? "Online" : "Offline"}
      </Typography>
      <Tooltip
        title={
          online
            ? "You are taking orders. Turn off to stop."
            : "You are not taking orders. Turn on to start."
        }
      >
        <Switch
          size={size}
          checked={online}
          onChange={(_, checked) => onChange(checked)}
          slotProps={{
            input: {
              "aria-label": online
                ? "Restaurant is online. Turn off to stop taking orders."
                : "Restaurant is offline. Turn on to start taking orders.",
            },
          }}
          sx={{
            "& .MuiSwitch-switchBase.Mui-checked": { color: ONLINE },
            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
              bgcolor: ONLINE,
            },
          }}
        />
      </Tooltip>
    </Box>
  );
}
