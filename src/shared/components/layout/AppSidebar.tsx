"use client";
import type { ReactElement } from "react";
import NextLink from "next/link";
import { Box, ButtonBase, Typography } from "@mui/material";
import PedalBikeOutlined from "@mui/icons-material/PedalBikeOutlined";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import RestaurantOutlined from "@mui/icons-material/RestaurantOutlined";
import ShoppingBagOutlined from "@mui/icons-material/ShoppingBagOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import { BrandLogo } from "./BrandLogo";
import {
  railItemFor,
  type RailItem,
  type RailItemId,
} from "@/core/constants/navigation";
import { tokens } from "@/core/theme/tokens";

/** Width of the icon rail, and of the logo tile above it. */
export const SIDEBAR_WIDTH = 88;

const ICON = { fontSize: 22 } as const;

const icons: Record<RailItemId, ReactElement> = {
  orders: <ShoppingBagOutlined sx={ICON} />,
  groupOrders: <GroupsOutlined sx={ICON} />,
  menu: <RestaurantOutlined sx={ICON} />,
  insights: <BarChartOutlined sx={ICON} />,
  payments: <AccountBalanceWalletOutlined sx={ICON} />,
  offers: <LocalOfferOutlined sx={ICON} />,
  riders: <PedalBikeOutlined sx={ICON} />,
  profile: <StorefrontOutlined sx={ICON} />,
};

export interface AppSidebarProps {
  items: RailItem[];
  pathname: string;
  /** A red count over an item's icon, e.g. orders still to finish. */
  badges?: Partial<Record<RailItemId, number>>;
  onNavigate: (href: string) => void;
}

/** The narrow icon rail: logo tile on top, one stacked icon and label per section. */
export function AppSidebar({
  items,
  pathname,
  badges = {},
  onNavigate,
}: AppSidebarProps) {
  const active = railItemFor(pathname)?.id;
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: tokens.color.card,
      }}
    >
      <Box
        component={NextLink}
        href="/dashboard"
        aria-label="TrainDhaba home"
        sx={{
          width: SIDEBAR_WIDTH,
          height: 72,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          bgcolor: tokens.color.card,
          borderBottom: `1px solid ${tokens.color.borderSubtle}`,
        }}
      >
        <BrandLogo size={56} />
      </Box>
      <Box
        component="nav"
        aria-label="Main menu"
        sx={{ display: "grid", alignContent: "start" }}
      >
        {items.map((item) => {
          const selected = active === item.id,
            count = badges[item.id] ?? 0;
          return (
            <ButtonBase
              key={item.id}
              aria-label={item.label}
              aria-current={selected ? "page" : undefined}
              onClick={() => onNavigate(item.href)}
              sx={{
                position: "relative",
                height: 72,
                width: "100%",
                flexDirection: "column",
                gap: 0.5,
                color: selected ? tokens.color.primary : tokens.color.textMuted,
                bgcolor: selected ? tokens.color.primarySubtle : "transparent",
                "&:hover": {
                  bgcolor: selected
                    ? tokens.color.primarySubtle
                    : tokens.color.sunken,
                },
                "&::before": selected
                  ? {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 14,
                      bottom: 14,
                      width: 3,
                      borderRadius: "0 3px 3px 0",
                      bgcolor: tokens.color.primary,
                    }
                  : undefined,
              }}
            >
              <Box sx={{ position: "relative", display: "grid" }}>
                {icons[item.id]}
                {count > 0 && (
                  <Box
                    component="span"
                    sx={{
                      position: "absolute",
                      top: -6,
                      right: -9,
                      minWidth: 18,
                      height: 18,
                      px: 0.5,
                      borderRadius: "999px",
                      fontSize: 11,
                      lineHeight: "18px",
                      fontWeight: 700,
                      textAlign: "center",
                      color: "#fff",
                      bgcolor: "#d93025",
                    }}
                  >
                    {count > 99 ? "99+" : count}
                  </Box>
                )}
              </Box>
              <Typography
                component="span"
                sx={{ fontSize: 12, lineHeight: "16px", fontWeight: 500 }}
              >
                {item.label}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
