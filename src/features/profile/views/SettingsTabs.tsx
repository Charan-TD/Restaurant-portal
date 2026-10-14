"use client";
import { usePathname, useRouter } from "next/navigation";
import { Tab, Tabs } from "@mui/material";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
const tabs = [
  {
    href: "/settings/working-hours",
    label: "Working hours",
    icon: <ScheduleOutlined />,
  },
  {
    href: "/settings/password",
    label: "Change password",
    icon: <LockOutlined />,
  },
];
/** Switches between the pages of the Settings section. */
export function SettingsTabs() {
  const pathname = usePathname(),
    router = useRouter();
  return (
    <Tabs
      value={tabs.some((t) => t.href === pathname) ? pathname : false}
      onChange={(_, href: string) => router.push(href)}
      variant="scrollable"
      scrollButtons="auto"
      aria-label="Settings"
      sx={{ mb: 3, borderBottom: 1, borderColor: "divider", minHeight: 48 }}
    >
      {tabs.map((t) => (
        <Tab
          key={t.href}
          value={t.href}
          label={t.label}
          icon={t.icon}
          iconPosition="start"
          sx={{ minHeight: 48, fontWeight: 600 }}
        />
      ))}
    </Tabs>
  );
}
