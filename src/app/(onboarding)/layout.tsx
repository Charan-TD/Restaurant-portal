import type { ReactNode } from "react";
import { PortalShell } from "@/shared/components/layout/PortalShell";
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PortalShell>{children}</PortalShell>;
}
