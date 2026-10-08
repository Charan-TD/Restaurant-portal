"use client";
import { Badge, type BadgeProps } from "@mui/material";
import { keyframes } from "@mui/material/styles";
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.6); opacity: 1; }
  50% { opacity: 0.45; }
  70% { box-shadow: 0 0 0 6px rgba(211, 47, 47, 0); }
  100% { box-shadow: 0 0 0 0 rgba(211, 47, 47, 0); opacity: 1; }
`;
export interface BlinkBadgeProps extends Omit<BadgeProps, "invisible"> {
  /** Blinks while there are unchecked alerts. */
  active: boolean;
}
/** A dot that blinks on its child while there are unchecked alerts. */
export function BlinkBadge({ active, sx, ...props }: BlinkBadgeProps) {
  return (
    <Badge
      variant="dot"
      color="error"
      overlap="circular"
      invisible={!active}
      sx={[
        {
          "& .MuiBadge-dot": {
            width: 10,
            height: 10,
            borderRadius: "50%",
            border: "2px solid",
            borderColor: "background.paper",
            animation: `${pulse} 1.4s ease-in-out infinite`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}
