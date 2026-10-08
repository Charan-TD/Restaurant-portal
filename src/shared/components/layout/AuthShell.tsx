import type { ReactNode } from "react";
import { PortalHeader } from "./PortalHeader";
/** Header only, without the setup steps, for login and similar pages. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <>
      <PortalHeader />
      <main className="auth-main">{children}</main>
    </>
  );
}
