"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
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
          sx={{ width: 40, height: 40, color: "#1c1c1c" }}
        >
          <Badge
            badgeContent={vm.unreadCount}
            max={99}
            sx={{
              "& .MuiBadge-badge": {
                bgcolor: "#d93025",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                minWidth: 18,
                height: 18,
              },
            }}
          >
            <NotificationsNoneOutlined />
          </Badge>
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
        <Box sx={{ p: 1, borderTop: 1, borderColor: "divider" }}>
          <Button
            fullWidth
            size="small"
            onClick={() => {
              setAnchor(null);
              router.push("/notifications");
            }}
          >
            View all notifications
          </Button>
        </Box>
      </Popover>
    </>
  );
}
