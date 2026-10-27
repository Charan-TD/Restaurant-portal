import type { ReactElement } from "react";
import { Tooltip, type TooltipProps } from "@mui/material";

/**
 * A short hover message for a button. The span lets it show on a button that
 * is disabled, which receives no hover events of its own.
 */
export function Hint({
  title,
  placement = "top",
  children,
}: {
  title: string;
  placement?: TooltipProps["placement"];
  children: ReactElement;
}) {
  return (
    <Tooltip title={title} placement={placement}>
      <span style={{ display: "inline-flex" }}>{children}</span>
    </Tooltip>
  );
}
