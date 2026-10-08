"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItemButton,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsNoneOutlined from "@mui/icons-material/NotificationsNoneOutlined";
import { BlinkBadge } from "@/shared/components/feedback/BlinkBadge";
import type { NotificationsViewModel } from "@/features/notifications/viewmodels/useNotificationsViewModel";
export function NotificationsMenu({ vm }: { vm: NotificationsViewModel }) {
  const router = useRouter(),
    [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const label = vm.unreadCount
    ? `Notifications, ${vm.unreadCount} unread`
    : "Notifications";
  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          aria-label={label}
          aria-haspopup="dialog"
          onClick={(e) => setAnchor(e.currentTarget)}
          sx={{ border: 1, borderColor: "divider" }}
        >
          <BlinkBadge active={vm.unreadCount > 0}>
            <NotificationsNoneOutlined fontSize="small" />
          </BlinkBadge>
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 360,
              maxWidth: "calc(100vw - 32px)",
              borderRadius: 3,
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <div>
            <Typography sx={{ fontWeight: 700 }}>Notifications</Typography>
            <Typography variant="caption" color="text.secondary">
              {vm.unreadCount
                ? `${vm.unreadCount} unread`
                : "You’re all caught up"}
            </Typography>
          </div>
          <Button
            size="small"
            disabled={!vm.unreadCount}
            onClick={vm.markAllRead}
          >
            Mark all as read
          </Button>
        </Box>
        <List disablePadding sx={{ maxHeight: 400, overflowY: "auto" }}>
          {vm.notifications.map((n) => (
            <ListItemButton
              key={n.id}
              onClick={() => {
                vm.markRead(n.id);
                setAnchor(null);
                router.push(n.href);
              }}
              sx={{
                gap: 1.5,
                alignItems: "flex-start",
                py: 1.5,
                bgcolor: n.read ? undefined : "action.hover",
              }}
            >
              <Box
                aria-hidden
                sx={{
                  mt: 0.75,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  flexShrink: 0,
                  bgcolor: n.read ? "transparent" : "error.main",
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: n.read ? 500 : 700 }}
                >
                  {n.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {n.time}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </>
  );
}
