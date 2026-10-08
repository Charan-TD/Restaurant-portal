import type { ReactNode } from "react";
import { PortalHeader } from "./PortalHeader";
import { SetupSidebar } from "./SetupSidebar";
export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <>
      <PortalHeader />
      <div className="shell">
        <SetupSidebar />
        <main>{children}</main>
      </div>
    </>
  );
}
