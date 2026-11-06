"use client";
import { useState, type ReactNode } from "react";
import {
  Box,
  FormControlLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import PercentOutlined from "@mui/icons-material/PercentOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { TimeField } from "@/shared/components/form/TimeField";
import { cardHeaderSx, cardSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonSelect } from "@/shared/components/form/CommonSelect";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField } from "@/shared/components/form/FormField";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { StatTile } from "@/shared/components/layout/StatTile";
import { CountTabs } from "@/shared/components/navigation/CountTabs";
import {
  CUSTOMER_TYPES,
  OFFER_TYPES,
  emptyOfferForm,
  offerDetail,
  offerHeadline,
  valueLabel,
  valuePrefix,
  type OfferForm,
  type OfferStatus,
} from "../models/offer";

const TABS: { id: OfferStatus; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "paused", label: "Paused" },
  { id: "scheduled", label: "Scheduled" },
  { id: "ended", label: "Ended" },
];

/** Two native pickers drawn as one bordered field, with an icon at the end. */
function RangeField({
  type,
  from,
  to,
  onFrom,
  onTo,
  icon,
  label,
}: {
  type: "date" | "time";
  from: string;
  to: string;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
  icon: ReactNode;
  label: string;
}) {
  const input = {
    border: 0,
    outline: 0,
    background: "transparent",
    font: "inherit",
    fontSize: 15,
    color: tokens.color.text,
    minWidth: 0,
    flex: 1,
  } as const;
  if (type === "time")
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TimeField label={`${label} from`} value={from} onChange={onFrom} />
        <span style={{ color: tokens.color.textSubtle }}>–</span>
        <TimeField label={`${label} to`} value={to} onChange={onTo} />
      </Box>
    );
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        height: 48,
        px: 1.75,
        borderRadius: tokens.radius.input,
        border: `1.5px solid ${tokens.color.borderInput}`,
        bgcolor: tokens.color.card,
        "&:focus-within": { borderColor: tokens.color.borderStrong },
        "& input::-webkit-calendar-picker-indicator": { display: "none" },
      }}
    >
      <input
        type={type}
        value={from}
        aria-label={`${label} from`}
        onChange={(e) => onFrom(e.target.value)}
        style={input}
      />
      <span style={{ color: tokens.color.textSubtle }}>–</span>
      <input
        type={type}
        value={to}
        min={type === "date" ? from || undefined : undefined}
        aria-label={`${label} to`}
        onChange={(e) => onTo(e.target.value)}
        style={input}
      />
      <Box sx={{ display: "grid", color: tokens.color.textMuted }}>{icon}</Box>
    </Box>
  );
}

/**
 * Offers: status tabs, summary tiles, the offer list and a Create offer form.
 * The server has no offers API yet, so nothing is listed or saved; the form
 * only shows how an offer will look to passengers.
 */
export function OffersView() {
  const [tab, setTab] = useState<OfferStatus>("live"),
    [form, setForm] = useState<OfferForm>(emptyOfferForm),
    set = <K extends keyof OfferForm>(key: K, value: OfferForm[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    headline = offerHeadline(form),
    prefix = valuePrefix(form.type),
    numeric = form.type !== "Free item",
    unit = (text?: string) =>
      text
        ? {
            startAdornment: (
              <InputAdornment position="start">{text}</InputAdornment>
            ),
          }
        : undefined;
  return (
    <ScreenSurface>
      <CountTabs
        label="Offers by status"
        value={tab}
        onChange={setTab}
        tabs={TABS.map((t) => ({ ...t, count: 0 }))}
        trailing="Passengers see live offers on your menu and at checkout"
      />
      <Box
        sx={{
          mt: 2.5,
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" },
        }}
      >
        <Box sx={{ display: "grid", gap: 2.5 }}>
          <Box
            sx={{
              display: "grid",
              gap: 2.5,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            }}
          >
            <StatTile
              label="Orders with offers"
              value="—"
              note="Last 7 days"
            />
            <StatTile
              label="Discount you gave"
              value="—"
              note="Comes out of your payout"
            />
            <StatTile
              label="Sales from offers"
              value="—"
              note="Order value of those orders"
            />
          </Box>
          <Box
            sx={{
              ...cardSx,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              py: 8,
              textAlign: "center",
            }}
          >
            <LocalOfferOutlined
              sx={{ fontSize: 44, color: tokens.color.dashed }}
            />
            <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
              No {TABS.find((t) => t.id === tab)?.label.toLowerCase()} offers
            </Typography>
            <Typography
              sx={{ maxWidth: 380, fontSize: 15, color: tokens.color.textMuted }}
            >
              Offers you create will be listed here. Saving offers is not
              available yet.
            </Typography>
          </Box>
        </Box>
        <Box component="form" noValidate sx={{ ...cardSx, overflow: "hidden" }}>
          <Box sx={cardHeaderSx}>
            <Typography className="title">Create offer</Typography>
            <Typography className="subtitle">
              You fund the discount from your payout
            </Typography>
          </Box>
          <Box sx={{ p: 3, display: "grid", gap: 2.5 }}>
            <FormField label="Type of discount" htmlFor="offer-type">
              <CommonSelect
                id="offer-type"
                value={form.type}
                options={OFFER_TYPES}
                onChange={(e) => {
                  set("type", e.target.value as OfferForm["type"]);
                  set("value", "");
                }}
                helperText="% off, flat ₹ off, free item or combo price"
              />
            </FormField>
            <Box
              sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}
            >
              <FormField label={valueLabel(form.type)} htmlFor="offer-value">
                <CommonTextField
                  id="offer-value"
                  value={form.value}
                  onChange={(e) =>
                    set(
                      "value",
                      numeric
                        ? e.target.value.replace(/\D/g, "")
                        : e.target.value,
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      inputMode: numeric ? "numeric" : "text",
                      maxLength: numeric ? 5 : 60,
                    },
                    input: unit(prefix),
                  }}
                />
              </FormField>
              <FormField label="Min order value" htmlFor="offer-min">
                <CommonTextField
                  id="offer-min"
                  value={form.minOrder}
                  onChange={(e) =>
                    set("minOrder", e.target.value.replace(/\D/g, ""))
                  }
                  slotProps={{
                    htmlInput: { inputMode: "numeric", maxLength: 6 },
                    input: unit("₹"),
                  }}
                />
              </FormField>
            </Box>
            <FormField label="Validity period">
              <RangeField
                type="date"
                label="Validity"
                from={form.startDate}
                to={form.endDate}
                onFrom={(v) => set("startDate", v)}
                onTo={(v) => set("endDate", v)}
                icon={<CalendarMonthOutlined fontSize="small" />}
              />
            </FormField>
            <FormField label="Daily time slot">
              <RangeField
                type="time"
                label="Time slot"
                from={form.startTime}
                to={form.endTime}
                onFrom={(v) => set("startTime", v)}
                onTo={(v) => set("endTime", v)}
                icon={<ScheduleOutlined fontSize="small" />}
              />
              <Typography
                sx={{ mt: 0.75, fontSize: 12, color: tokens.color.textSubtle }}
              >
                Offer shows only in this window each day
              </Typography>
            </FormField>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                Type of customer
              </Typography>
              <RadioGroup
                value={form.customer}
                onChange={(e) =>
                  set("customer", e.target.value as OfferForm["customer"])
                }
              >
                {CUSTOMER_TYPES.map((c) => (
                  <FormControlLabel
                    key={c}
                    value={c}
                    control={
                      <Radio
                        sx={{
                          color: tokens.color.borderInput,
                          "&.Mui-checked": { color: tokens.color.primary },
                        }}
                      />
                    }
                    label={c}
                  />
                ))}
              </RadioGroup>
            </Box>
            <Box
              sx={{ p: 2, borderRadius: "12px", bgcolor: tokens.color.muted }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  lineHeight: "16px",
                  fontWeight: 700,
                  letterSpacing: "0.4px",
                  color: tokens.color.textMuted,
                }}
              >
                PASSENGERS SEE
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  borderRadius: "12px",
                  bgcolor: tokens.color.card,
                  border: `1px solid ${tokens.color.border}`,
                  minHeight: 64,
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
                    color: "#fff",
                    bgcolor: tokens.color.success,
                  }}
                >
                  <PercentOutlined fontSize="small" />
                </Box>
                {headline ? (
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                      {headline}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12, color: tokens.color.textMuted }}
                    >
                      {offerDetail(form)}
                    </Typography>
                  </Box>
                ) : (
                  <Typography
                    sx={{ fontSize: 14, color: tokens.color.textSubtle }}
                  >
                    Fill in the discount to preview the offer.
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              p: 3,
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: "1fr 2fr",
              borderTop: `1px solid ${tokens.color.borderSubtle}`,
            }}
          >
            <CommonButton
              variant="text"
              onClick={() => setForm(emptyOfferForm())}
            >
              Cancel
            </CommonButton>
            <CommonButton variant="contained" disabled>
              Schedule offer
            </CommonButton>
          </Box>
        </Box>
      </Box>
    </ScreenSurface>
  );
}
