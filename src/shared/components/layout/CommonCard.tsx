import type { HTMLAttributes } from "react";
export function CommonCard({
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section className={`card ${className}`.trim()} {...props} />;
}
