"use client";
import { useRouter } from "next/navigation";
import { Avatar, IconButton } from "@mui/material";
import { BlinkBadge } from "@/shared/components/feedback/BlinkBadge";
import { PROFILE_HREF } from "@/features/profile/models/profile";
import type { PortalShellViewModel } from "../viewmodels/usePortalShellViewModel";
/** Avatar button that opens the vendor's profile page. */
export function ProfileMenu({ vm }: { vm: PortalShellViewModel }) {
  const router = useRouter(),
    alert = vm.notifications.hasAlert("profile");
  return (
    <IconButton
      aria-label={`Open profile of ${vm.vendorName}`}
      onClick={() => {
        vm.notifications.markSourceRead("profile");
        router.push(PROFILE_HREF);
      }}
      sx={{ p: 0.25 }}
    >
      <BlinkBadge active={alert}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: "primary.main",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {vm.initials}
        </Avatar>
      </BlinkBadge>
    </IconButton>
  );
}
