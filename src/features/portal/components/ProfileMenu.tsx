"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Popover,
  Typography,
} from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import MailOutline from "@mui/icons-material/MailOutlined";
import PhoneOutlined from "@mui/icons-material/PhoneOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import { BlinkBadge } from "@/shared/components/feedback/BlinkBadge";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import type { PortalShellViewModel } from "../viewmodels/usePortalShellViewModel";
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
      <Box sx={{ color: "text.secondary", display: "flex" }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="body2"
          noWrap
          color={value ? "text.primary" : "text.disabled"}
          sx={{ fontWeight: value ? 500 : 400 }}
        >
          {value || "Not added"}
        </Typography>
      </Box>
    </Box>
  );
}
/** Avatar button that opens the vendor's profile card. */
export function ProfileMenu({ vm }: { vm: PortalShellViewModel }) {
  const router = useRouter(),
    [anchor, setAnchor] = useState<HTMLElement | null>(null),
    alert = vm.notifications.hasAlert("profile");
  const close = () => {
    setAnchor(null);
    vm.notifications.markSourceRead("profile");
  };
  return (
    <>
      <IconButton
        aria-label={`Profile of ${vm.vendorName}`}
        aria-haspopup="dialog"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ p: 0.25 }}
      >
        <BlinkBadge active={alert}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "primary.main",
              fontSize: 15,
              fontWeight: 700,
            }}
          >
            {vm.initials}
          </Avatar>
        </BlinkBadge>
      </IconButton>
      <Popover
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            role: "dialog",
            "aria-label": "Vendor profile",
            sx: { mt: 1, width: 300, borderRadius: 3 },
          },
        }}
      >
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: "primary.main",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {vm.initials}
          </Avatar>
          <Typography
            noWrap
            sx={{ mt: 1.5, fontWeight: 700, fontSize: 17, maxWidth: "100%" }}
          >
            {vm.vendorName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vendor · Restaurant partner
          </Typography>
        </Box>
        <Divider />
        <Box sx={{ px: 2.5, py: 1 }}>
          <DetailRow
            icon={<StorefrontOutlined fontSize="small" />}
            label="Restaurant"
            value={vm.restaurantName}
          />
          <DetailRow
            icon={<MailOutline fontSize="small" />}
            label="Email"
            value={vm.profile.email}
          />
          <DetailRow
            icon={<PhoneOutlined fontSize="small" />}
            label="Mobile"
            value={vm.profile.mobile}
          />
          <DetailRow
            icon={<PlaceOutlined fontSize="small" />}
            label="City"
            value={vm.profile.city}
          />
        </Box>
        <Divider />
        <Box sx={{ p: 2, display: "grid", gap: 1 }}>
          <CommonButton
            variant="contained"
            fullWidth
            startIcon={<EditOutlined />}
            onClick={() => {
              close();
              router.push("/settings/profile");
            }}
          >
            Edit profile
          </CommonButton>
          <CommonButton
            fullWidth
            startIcon={<LogoutOutlined />}
            onClick={() => {
              setAnchor(null);
              vm.logout();
            }}
            sx={{ color: "error.main" }}
          >
            Log out
          </CommonButton>
        </Box>
      </Popover>
    </>
  );
}
