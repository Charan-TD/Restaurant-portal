import type { ReactNode } from "react";
import { BackButton } from "../actions/BackButton";
import { PortalHeader } from "./PortalHeader";
import { SetupSidebar } from "./SetupSidebar";
export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <>
      <PortalHeader />
      <div className="shell">
        <SetupSidebar />
        <main>
          <BackButton fallbackHref="/login" />
          {children}
        </main>
      </div>
    </>
  );
}
