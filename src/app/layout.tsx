import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/core/providers/AppProviders";
import "./globals.css";
export const metadata: Metadata = {
  title: "Train Dhaba · Restaurant Partner Portal",
  description: "Train Dhaba restaurant vendor portal",
  icons: { icon: "/logo.jpg", apple: "/logo.jpg" },
};
// A fixed 1:1 scale on every device; the layout adapts instead of zooming.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};
// Each route group ((auth), (onboarding), (portal)) adds its own shell.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
