"use client";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Menu,
  MenuItem,
  ListItemText,
  Box,
  Typography,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { BlinkBadge } from "../feedback/BlinkBadge";
import type { NavPage } from "@/core/constants/navigation";
export interface NavDropdownProps {
  label: string;
  icon: ReactNode;
  pages: NavPage[];
  /** Blinks the button while this menu has unchecked alerts. */
  alert?: boolean;
  /** Marks a single page that has an unchecked alert. */
  pageAlert?: (href: string) => boolean;
  /** Called when the menu closes, e.g. to mark its alerts as checked. */
  onClose?: () => void;
}
export function NavDropdown({
  label,
  icon,
  pages,
  alert = false,
  pageAlert,
  onClose,
}: NavDropdownProps) {
  const router = useRouter(),
    [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const close = () => {
    setAnchor(null);
    onClose?.();
  };
  return (
    <>
      <Button
        color="inherit"
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        aria-label={alert ? `${label}, new alerts` : label}
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={<BlinkBadge active={alert}>{icon}</BlinkBadge>}
        endIcon={<ExpandMore fontSize="small" />}
        sx={{
          color: "text.secondary",
          px: 1.5,
          minWidth: 0,
          borderRadius: 999,
          "&:hover, &[aria-expanded='true']": {
            color: "primary.main",
            bgcolor: "action.hover",
          },
          "& .nav-label, & .MuiButton-endIcon": {
            display: { xs: "none", lg: "inline-flex" },
          },
          "& .MuiButton-startIcon": { mr: { xs: 0, lg: 1 } },
        }}
      >
        <span className="nav-label">{label}</span>
      </Button>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: { sx: { mt: 1, width: 300, borderRadius: 3, p: 0.5 } },
        }}
      >
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ px: 2, display: "block" }}
        >
          {label}
        </Typography>
        {pages.map((page) => (
          <MenuItem
            key={page.href}
            sx={{ borderRadius: 2, alignItems: "flex-start", gap: 1.5 }}
            onClick={() => {
              close();
              router.push(page.href);
            }}
          >
            <ListItemText
              primary={page.label}
              secondary={page.description}
              slotProps={{
                primary: { sx: { fontWeight: 600, fontSize: 14 } },
                secondary: { sx: { fontSize: 12, whiteSpace: "normal" } },
              }}
            />
            {pageAlert?.(page.href) && (
              <Box
                component="span"
                aria-label="New"
                sx={{
                  mt: 1,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: "error.main",
                  flexShrink: 0,
                }}
              />
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
