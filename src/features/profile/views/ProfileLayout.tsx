"use client";
import { useState, type ReactNode } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Box, ButtonBase, Typography } from "@mui/material";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import ChevronRight from "@mui/icons-material/ChevronRight";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import StarBorderOutlined from "@mui/icons-material/StarBorderOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { usePortal } from "@/core/providers/PortalProvider";
import { useLogoutMutation } from "@/features/auth/services/authApi";
import { DEMO_MODE } from "@/core/constants/config";
import type { ProfileViewModel } from "../viewmodels/useProfileViewModel";
import { useChangeRequests } from "../viewmodels/useChangeRequests";
import { BankPane } from "./BankPane";
import { DocumentsPane } from "./DocumentsPane";
import { HoursPane } from "./HoursPane";
import { LocationPane } from "./LocationPane";
import { SettingsPane } from "./SettingsPane";
import { RestaurantDetailsPanel } from "./RestaurantDetailsPanel";

type SectionId =
  | "details"
  | "location"
  | "documents"
  | "bank"
  | "hours"
  | "settings";

/** "09:00" → "9:00 AM". */
const clock = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

const rowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  width: "100%",
  textAlign: "left",
  px: 1.5,
  py: 1.25,
  borderRadius: "12px",
  justifyContent: "flex-start",
  color: "text.primary",
} as const;

function NavRow({
  icon,
  title,
  hint,
  selected,
  ...action
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  selected?: boolean;
} & ({ onClick: () => void } | { href: string })) {
  return (
    <ButtonBase
      {...("href" in action
        ? { component: NextLink, href: action.href }
        : { onClick: action.onClick })}
      aria-current={selected ? "page" : undefined}
      sx={{
        ...rowSx,
        minWidth: 0,
        bgcolor: selected ? tokens.color.primarySubtle : undefined,
        "&:hover": {
          bgcolor: selected ? tokens.color.primarySubtle : tokens.color.muted,
        },
      }}
    >
      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          color: selected ? tokens.color.primary : tokens.color.textMuted,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          noWrap
          sx={{
            fontWeight: 600,
            fontSize: 15,
            color: tokens.color.text,
          }}
        >
          {title}
        </Typography>
        {hint && (
          <Typography noWrap sx={{ fontSize: 12, color: tokens.color.textMuted }}>
            {hint}
          </Typography>
        )}
      </Box>
      <ChevronRight fontSize="small" sx={{ color: tokens.color.textSubtle }} />
    </ButtonBase>
  );
}

const paneSx = cardSx;

/** Profile as two panes: the sections on the left, the chosen one on the right. */
export function ProfileLayout({ vm }: { vm: ProfileViewModel }) {
  const router = useRouter(),
    portal = usePortal(),
    [logoutRequest] = useLogoutMutation(),
    [section, setSection] = useState<SectionId>("details"),
    changes = useChangeRequests(),
    { vendor, details } = vm,
    place = details?.location,
    area = [place?.city, place?.state].filter(Boolean).join(", "),
    cityLine = [area, place?.pincode].filter(Boolean).join(" - "),
    name = details?.name || vendor.restaurantName,
    // Monday is first in the list; getDay() starts on Sunday.
    today = details?.hours[(new Date().getDay() + 6) % 7],
    account = details?.bank.account,
    pick = (id: SectionId) => () => setSection(id),
    logout = () => {
      // Leave the portal even if the backend call fails.
      void logoutRequest()
        .unwrap()
        .catch(() => undefined);
      portal.setAuthenticated(false);
      portal.setProfile({});
      router.replace("/login");
    };
  return (
    <Box
      sx={{
        display: "grid",
        gap: 3,
        alignItems: "start",
        gridTemplateColumns: { xs: "1fr", md: "320px minmax(0, 1fr)" },
      }}
    >
      <Box sx={{ ...paneSx, p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 1.5 }}>
          <Avatar
            src={details?.logoUrl}
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
              borderRadius: "12px",
              bgcolor: tokens.color.muted,
              color: tokens.color.text,
              fontWeight: 800,
            }}
          >
            {vendor.initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontWeight: 700, fontSize: 16 }}>
              {name || "Restaurant name not added"}
            </Typography>
            <Typography noWrap sx={{ fontSize: 14, color: tokens.color.link }}>
              {cityLine || vendor.city || vendor.vendorName}
            </Typography>
            <Box
              sx={{
                mt: 0.25,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                fontSize: 13,
                color: tokens.color.textMuted,
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: vendor.online
                    ? tokens.color.success
                    : tokens.color.textSubtle,
                }}
              />
              {vendor.online ? "Open" : "Closed"}
            </Box>
          </Box>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 0.5,
            borderTop: `1px solid ${tokens.color.borderSubtle}`,
            pt: 1.5,
          }}
        >
          <NavRow
            icon={<StorefrontOutlined />}
            title="Restaurant details"
            hint="Name, owner, cuisines, food type"
            selected={section === "details"}
            onClick={pick("details")}
          />
          <NavRow
            icon={<PlaceOutlined />}
            title="Restaurant location"
            hint={cityLine || "Address and map pin"}
            selected={section === "location"}
            onClick={pick("location")}
          />
          {!DEMO_MODE && (
            <NavRow
              icon={<DescriptionOutlined />}
              title="Business documents"
              hint="Names, GST, PAN and Aadhaar"
              selected={section === "documents"}
              onClick={pick("documents")}
            />
          )}
          {!DEMO_MODE && (
            <NavRow
              icon={<AccountBalanceOutlined />}
              title="Bank account"
              hint={
                details?.bank.bank
                  ? `${details.bank.bank}${account ? ` ••${account.slice(-4)}` : ""}`
                  : "Where payouts are sent"
              }
              selected={section === "bank"}
              onClick={pick("bank")}
            />
          )}
          <NavRow
            icon={<ScheduleOutlined />}
            title="Operating hours"
            hint={
              today?.open
                ? `Today ${clock(today.start)} – ${clock(today.end)}`
                : today
                  ? "Closed today"
                  : "Days and times you take orders"
            }
            selected={section === "hours"}
            onClick={pick("hours")}
          />
          <NavRow
            icon={<StarBorderOutlined />}
            title="Ratings & reviews"
            hint="What customers said about their orders"
            href="/customers/feedback"
          />
          <NavRow
            icon={<TuneOutlined />}
            title="Settings"
            hint="Alerts and password"
            selected={section === "settings"}
            onClick={pick("settings")}
          />
        </Box>
        <Box
          sx={{
            mt: 1.5,
            pt: 1.5,
            borderTop: `1px solid ${tokens.color.borderSubtle}`,
          }}
        >
          <ButtonBase
            onClick={logout}
            sx={{ ...rowSx, color: tokens.color.error, gap: 1.5 }}
          >
            <LogoutOutlined />
            <Typography sx={{ fontWeight: 600, fontSize: 15 }}>
              Log out
            </Typography>
          </ButtonBase>
        </Box>
      </Box>
      <Box sx={{ ...paneSx, overflow: "hidden" }}>
        {section === "details" && <RestaurantDetailsPanel vm={vm} />}
        {section === "location" && (
          <LocationPane details={details} onSent={changes.reload} />
        )}
        {section === "documents" && (
          <DocumentsPane
            details={details}
            requests={changes.requests}
            onSent={changes.reload}
          />
        )}
        {section === "bank" && (
          <BankPane details={details} onSaved={vm.reloadDetails} />
        )}
        {section === "hours" && <HoursPane />}
        {section === "settings" && <SettingsPane />}
      </Box>
    </Box>
  );
}
