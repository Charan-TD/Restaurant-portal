import type { ReactNode } from "react";
import { AppShell } from "@/features/portal/views/AppShell";
export default function PortalLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
