"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Box,
  Collapse,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import type { NavSection } from "@/core/constants/navigation";
import { navIcons } from "../navigation/navIcons";
export const SIDEBAR_WIDTH = 272;
export interface AppSidebarProps {
  sections: NavSection[];
  pathname: string;
  restaurantName: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
}
const itemSx = {
  borderRadius: "12px",
  minHeight: 44,
  px: 1.5,
  color: "text.secondary",
  "& .MuiListItemIcon-root": { minWidth: 36, color: "inherit" },
  "&:hover": { bgcolor: "action.hover", color: "text.primary" },
} as const;
export function AppSidebar({
  sections,
  pathname,
  restaurantName,
  onNavigate,
  onLogout,
}: AppSidebarProps) {
  const activeSection = sections.find((s) =>
    s.pages.some((p) => pathname.startsWith(p.href)),
  )?.id;
  // The section holding the current page starts open; others toggle freely.
  const [open, setOpen] = useState<string[]>(
    activeSection ? [activeSection] : [],
  );
  // Also open it when navigating there from the search or navbar.
  const [shownSection, setShownSection] = useState(activeSection);
  if (activeSection !== shownSection) {
    setShownSection(activeSection);
    if (activeSection && !open.includes(activeSection))
      setOpen([...open, activeSection]);
  }
  const toggle = (id: string) =>
    setOpen((old) =>
      old.includes(id) ? old.filter((o) => o !== id) : [...old, id],
    );
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: 2,
        py: 2.5,
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
        <Image
          src="/logo.jpg"
          alt="Train Dhaba logo"
          width={40}
          height={40}
          className="brand-logo"
          priority
        />
        <div>
          <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Train Dhaba
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Partner portal
          </Typography>
        </div>
      </Box>
      <Box
        sx={{
          mt: 3,
          mb: 3,
          px: 1.5,
          py: 1.25,
          borderRadius: "12px",
          border: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          gap: 1.25,
        }}
      >
        <StorefrontOutlined
          fontSize="small"
          sx={{ color: "text.secondary", flexShrink: 0 }}
        />
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {restaurantName}
        </Typography>
      </Box>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ px: 1.5, mb: 1, letterSpacing: 1.2 }}
      >
        Main menu
      </Typography>
      <List
        component="nav"
        aria-label="Main menu"
        disablePadding
        sx={{ display: "grid", gap: 1, overflowY: "auto" }}
      >
        {sections.map((section) => {
          if (section.href) {
            const selected = pathname === section.href;
            return (
              <ListItemButton
                key={section.id}
                selected={selected}
                aria-current={selected ? "page" : undefined}
                onClick={() => onNavigate(section.href!)}
                sx={{
                  ...itemSx,
                  "&.Mui-selected, &.Mui-selected:hover": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  },
                }}
              >
                <ListItemIcon>{navIcons[section.id]}</ListItemIcon>
                <ListItemText
                  primary={section.label}
                  slotProps={{
                    primary: { sx: { fontWeight: 600, fontSize: 14 } },
                  }}
                />
              </ListItemButton>
            );
          }
          const expanded = open.includes(section.id),
            containsActive = activeSection === section.id;
          return (
            <div key={section.id}>
              <ListItemButton
                aria-expanded={expanded}
                onClick={() => toggle(section.id)}
                sx={{
                  ...itemSx,
                  ...(containsActive && { color: "primary.main" }),
                }}
              >
                <ListItemIcon>{navIcons[section.id]}</ListItemIcon>
                <ListItemText
                  primary={section.label}
                  slotProps={{
                    primary: { sx: { fontWeight: 600, fontSize: 14 } },
                  }}
                />
                <ExpandMore
                  fontSize="small"
                  sx={{
                    transition: "transform .2s",
                    transform: expanded ? "rotate(180deg)" : "none",
                  }}
                />
              </ListItemButton>
              <Collapse in={expanded} unmountOnExit>
                <List
                  disablePadding
                  sx={{
                    ml: 3.25,
                    mt: 0.5,
                    pl: 1.5,
                    borderLeft: 1,
                    borderColor: "divider",
                    display: "grid",
                    gap: 0.5,
                  }}
                >
                  {section.pages.map((page) => {
                    const selected = pathname === page.href;
                    return (
                      <ListItemButton
                        key={page.href}
                        selected={selected}
                        aria-current={selected ? "page" : undefined}
                        onClick={() => onNavigate(page.href)}
                        sx={{
                          ...itemSx,
                          minHeight: 38,
                          "&.Mui-selected, &.Mui-selected:hover": {
                            bgcolor: "action.selected",
                            color: "primary.main",
                          },
                        }}
                      >
                        <ListItemText
                          primary={page.label}
                          slotProps={{
                            primary: {
                              sx: {
                                fontSize: 13.5,
                                fontWeight: selected ? 600 : 500,
                              },
                            },
                          }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Collapse>
            </div>
          );
        })}
      </List>
      <Box sx={{ flex: 1, minHeight: 24 }} />
      <Divider sx={{ mb: 1.5 }} />
      {/* ListItemButton grows by default; keep it a single compact row. */}
      <ListItemButton
        onClick={onLogout}
        sx={{
          ...itemSx,
          flexGrow: 0,
          minHeight: 40,
          "&:hover": {
            bgcolor: "rgba(211, 47, 47, 0.08)",
            color: "error.main",
          },
        }}
      >
        <ListItemIcon>
          <LogoutOutlined fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Log out"
          slotProps={{ primary: { sx: { fontWeight: 600, fontSize: 14 } } }}
        />
      </ListItemButton>
    </Box>
  );
}
