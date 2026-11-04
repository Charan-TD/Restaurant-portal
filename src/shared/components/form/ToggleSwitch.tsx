"use client";
import { Switch, type SwitchProps } from "@mui/material";
import { tokens } from "@/core/theme/tokens";

/** The design's switch: 44 × 26, green when on, with a 20px white knob. */
export function ToggleSwitch({ sx, ...props }: SwitchProps) {
  return (
    <Switch
      disableRipple
      sx={[
        {
          width: 44,
          height: 26,
          p: 0,
          flexShrink: 0,
          "& .MuiSwitch-switchBase": {
            p: "3px",
            color: "#fff",
            "&.Mui-checked": {
              transform: "translateX(18px)",
              color: "#fff",
              "& + .MuiSwitch-track": {
                bgcolor: tokens.color.success,
                opacity: 1,
              },
            },
            "&.Mui-focusVisible .MuiSwitch-thumb": {
              outline: `2px solid ${tokens.color.info}`,
              outlineOffset: 2,
            },
          },
          "& .MuiSwitch-thumb": {
            width: 20,
            height: 20,
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          },
          "& .MuiSwitch-track": {
            borderRadius: 13,
            bgcolor: "#c4c4c4",
            opacity: 1,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}
