import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppProviders } from "@/core/providers/AppProviders";
import "./globals.css";
export const metadata: Metadata = {
  title: "Train Dhaba · Restaurant Partner Portal",
  description: "Train Dhaba restaurant vendor portal",
  icons: { icon: "/logo.jpg", apple: "/logo.jpg" },
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
