"use client";
import type { ReactNode } from "react";
import type { DeepPartial } from "react-hook-form";
import { Box, ButtonBase, Typography } from "@mui/material";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import AccessTimeOutlined from "@mui/icons-material/AccessTimeOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import { stepIndex } from "@/core/constants/onboarding";
import { tokens } from "@/core/theme/tokens";
import type { OperatingDay, RegistrationForm } from "../models/registration";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** "09:00" stays "09:00": times are shown in 24 hours. */
const clock = (value: string) => {
  const [h, m] = value.split(":").map(Number);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Days with the same slots together: "Mon–Sat · 11:00–15:30"; closed days last. */
function hoursLines(hours: OperatingDay[] | undefined) {
  if (!hours?.length) return [];
  const groups = new Map<string, number[]>(),
    closed: number[] = [];
  hours.forEach((day, i) => {
    if (!day.open) return closed.push(i);
    const key = day.shifts
      .map((s) => `${clock(s.start)}–${clock(s.end)}`)
      .join(", ");
    groups.set(key, [...(groups.get(key) ?? []), i]);
  });
  const names = (list: number[]) =>
    list.length > 2 && list.every((d, i) => i === 0 || d === list[i - 1] + 1)
      ? `${DAYS[list[0]]}–${DAYS[list[list.length - 1]]}`
      : list.map((d) => DAYS[d]).join(", ");
  return [
    ...[...groups].map(([slots, list]) => `${names(list)} · ${slots}`),
    ...(closed.length
      ? [
          `${closed.length === 1 ? hours[closed[0]].day : names(closed)} closed`,
        ]
      : []),
  ];
}

interface Summary {
  icon: ReactNode;
  title: string;
  lines: string[];
  step: number;
}

/** The registration, section by section, as it was filled in. */
export function summaryOf(data: DeepPartial<RegistrationForm>): Summary[] {
  const expiry = data.documentNumbers?.fssaiExpiry,
    last4 = data.accountNumber?.slice(-4);
  return [
    data.restaurantName && {
      icon: <StorefrontOutlined fontSize="small" />,
      title: "Restaurant details",
      lines: [
        [data.restaurantName, data.restaurantType].filter(Boolean).join(" · "),
        [
          (data.foodServed ?? []).join(", ").toLowerCase(),
          data.riderOwner === "Traindhaba"
            ? "TrainDhaba rider"
            : data.riderOwner
              ? "Own riders"
              : "",
        ]
          .filter(Boolean)
          .join(" · "),
      ],
      step: stepIndex("details"),
    },
    data.city && {
      icon: <PlaceOutlined fontSize="small" />,
      title: "Location",
      lines: [
        [data.building, data.city, data.pincode].filter(Boolean).join(", "),
      ],
      step: stepIndex("location"),
    },
    data.documentNumbers?.fssai && {
      icon: <DescriptionOutlined fontSize="small" />,
      title: "Documents",
      lines: [
        [
          expiry
            ? `FSSAI valid until ${new Date(expiry).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`
            : "FSSAI",
          "PAN",
          "GST",
          "Identity",
          "Business proof",
        ].join(" · "),
      ],
      step: stepIndex("documents"),
    },
    data.accountNumber && {
      icon: <AccountBalanceOutlined fontSize="small" />,
      title: "Bank account",
      lines: [
        [data.bankName, last4 && `••${last4}`, data.ifsc && `IFSC ${data.ifsc}`]
          .filter(Boolean)
          .join(" · "),
      ],
      step: stepIndex("bank"),
    },
    data.hours?.length && {
      icon: <AccessTimeOutlined fontSize="small" />,
      title: "Operating hours",
      lines: hoursLines(data.hours as OperatingDay[]),
      step: stepIndex("hours"),
    },
  ].filter(Boolean) as Summary[];
}

/** The rows of "What you submitted", each with a button to change it. */
export function SubmissionSummary({
  rows,
  onEdit,
}: {
  rows: Summary[];
  onEdit: (step: number) => void;
}) {
  return (
    <Box
      sx={{
        border: `1px solid ${tokens.color.border}`,
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {rows.map((row) => (
        <Box
          key={row.title}
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
            p: 1.75,
            "& + &": { borderTop: `1px solid ${tokens.color.borderSubtle}` },
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              color: tokens.color.textMuted,
              bgcolor: tokens.color.muted,
            }}
          >
            {row.icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
              {row.title}{" "}
              <CheckOutlined
                sx={{
                  fontSize: 16,
                  color: tokens.color.success,
                  verticalAlign: "-3px",
                }}
              />
            </Typography>
            {row.lines.filter(Boolean).map((line) => (
              <Typography
                key={line}
                sx={{ fontSize: 13, color: tokens.color.textMuted }}
              >
                {line}
              </Typography>
            ))}
          </Box>
          <ButtonBase
              aria-label={`Edit ${row.title}`}
              onClick={() => onEdit(row.step)}
              sx={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: "8px",
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <EditOutlined sx={{ fontSize: 17 }} />
            </ButtonBase>
        </Box>
      ))}
    </Box>
  );
}
