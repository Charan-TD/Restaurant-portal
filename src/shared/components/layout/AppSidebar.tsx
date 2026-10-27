"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
} from "@mui/material";
import ChevronRight from "@mui/icons-material/ChevronRight";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import { navbarMenus, type NavSection } from "@/core/constants/navigation";
import { navIcons } from "../navigation/navIcons";
export const SIDEBAR_WIDTH = 248;
export interface AppSidebarProps {
  sections: NavSection[];
  pathname: string;
  restaurantName: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
}
export function AppSidebar({
  sections,
  pathname,
  restaurantName,
  onNavigate,
  onLogout,
}: AppSidebarProps) {
  const activeSection = [...sections, ...navbarMenus].find((section) =>
    section.pages.some((page) => page.href === pathname),
  )?.id;
  const [expandedSection, setExpandedSection] = useState<string | undefined>(
    activeSection,
  );
  const itemSx = {
    borderRadius: "10px",
    minHeight: 36,
    px: 1.5,
    color: "text.secondary",
    "& .MuiListItemIcon-root": {
      minWidth: 34,
      color: "inherit",
    },
    "&.Mui-selected, &.Mui-selected:hover": {
      bgcolor: "rgba(242,106,46,.1)",
      color: "primary.dark",
    },
  };
  const renderSection = (section: NavSection) => {
    const selected =
      section.href === pathname ||
      section.pages.some((page) => pathname === page.href);
    const hasPages = section.pages.length > 0;
    const expanded = expandedSection === section.id;
    return (
      <Box key={section.id}>
        <ListItemButton
          selected={selected}
          aria-label={section.label}
          aria-current={selected && !hasPages ? "page" : undefined}
          aria-expanded={hasPages ? expanded : undefined}
          aria-controls={hasPages ? `sidebar-${section.id}-pages` : undefined}
          onClick={() => {
            if (hasPages) {
              setExpandedSection(expanded ? undefined : section.id);
            } else if (section.href) {
              onNavigate(section.href);
            }
          }}
          sx={itemSx}
        >
          <ListItemIcon>{navIcons[section.id]}</ListItemIcon>
          <>
            <ListItemText
              primary={section.label}
              slotProps={{
                primary: { sx: { fontWeight: 600, fontSize: 13 } },
              }}
            />
            {hasPages && (
              <ChevronRight
                fontSize="small"
                sx={{
                  transform: expanded ? "rotate(90deg)" : "none",
                  transition: "transform .2s",
                }}
              />
            )}
          </>
        </ListItemButton>
        {hasPages && (
          <Collapse in={expanded} unmountOnExit>
            <List
              id={`sidebar-${section.id}-pages`}
              aria-label={`${section.label} subpages`}
              disablePadding
              sx={{
                ml: 3,
                pl: 1,
                my: 0.5,
                borderLeft: 1,
                borderColor: "divider",
                display: "grid",
                gap: 0.25,
              }}
            >
              {section.pages.map((page) => (
                <ListItemButton
                  key={page.href}
                  selected={pathname === page.href}
                  aria-current={pathname === page.href ? "page" : undefined}
                  onClick={() => onNavigate(page.href)}
                  sx={{ ...itemSx, minHeight: 32, px: 1.25 }}
                >
                  <ListItemText
                    primary={page.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: 12.5,
                          fontWeight: pathname === page.href ? 600 : 500,
                        },
                      },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: 2,
        py: 1.5,
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          justifyContent: "center",
        }}
      >
        <Image
          src="/logo.jpg"
          alt="Train Dhaba logo"
          width={30}
          height={30}
          className="brand-logo"
          priority
        />
        <Typography sx={{ fontWeight: 700, flex: 1, fontSize: 15 }}>
          Train Dhaba
        </Typography>
      </Box>
      <Box
        sx={{
          my: 1.5,
          p: 1,
          borderRadius: "10px",
          bgcolor: "rgba(242,106,46,.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <StorefrontOutlined
          fontSize="small"
          sx={{ color: "primary.main", flexShrink: 0 }}
        />
        <Typography variant="body2" noWrap sx={{ fontWeight: 600, flex: 1 }}>
          {restaurantName}
        </Typography>
      </Box>
      <List
        component="nav"
        aria-label="Main menu"
        disablePadding
        sx={{ display: "grid", gap: 0.25 }}
      >
        {sections.map(renderSection)}
      </List>
      <Divider sx={{ my: 1 }} />
      <List
        component="nav"
        aria-label="Management"
        disablePadding
        sx={{ display: "grid", gap: 0.25 }}
      >
        {navbarMenus.map(renderSection)}
      </List>
      <Box sx={{ flex: 1, minHeight: 8 }} />
      <Divider sx={{ my: 1 }} />
      <ListItemButton
        aria-label="Log out"
        onClick={onLogout}
        sx={{ ...itemSx, flexGrow: 0 }}
      >
        <ListItemIcon>
          <LogoutOutlined fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primary="Log out"
          slotProps={{ primary: { sx: { fontWeight: 600, fontSize: 13 } } }}
        />
      </ListItemButton>
    </Box>
  );
}
