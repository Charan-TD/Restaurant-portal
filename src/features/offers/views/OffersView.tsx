"use client";
import { useState, type ReactNode } from "react";
import {
  Box,
  ButtonBase,
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
import { DEMO_MODE } from "@/core/constants/config";
import { ToastAlert, useToast } from "@/core/providers/ToastProvider";
import { cardHeaderSx, cardSx, tokens } from "@/core/theme/tokens";
import { errorMessage } from "@/shared/utils/errors";
import { formatRupees } from "@/shared/utils/format";
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
  offerProblem,
  valueLabel,
  valuePrefix,
  type Offer,
  type OfferForm,
  type OfferStatus,
} from "../models/offer";
import {
  useCreateOfferMutation,
  useDeleteOfferMutation,
  useGetOfferMetricsQuery,
  useGetOffersQuery,
  useSetOfferActiveMutation,
  useUpdateOfferMutation,
} from "../services/offerApi";

const TABS: { id: OfferStatus; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "paused", label: "Paused" },
  { id: "scheduled", label: "Scheduled" },
  { id: "ended", label: "Ended" },
];

const day = (iso: string) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "";

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

const small = {
  height: 32,
  px: 1.5,
  fontSize: 12,
  fontWeight: 600,
  borderRadius: "8px",
  border: `1px solid ${tokens.color.borderInput}`,
} as const;

/** One offer in the list, with what can be done to it. */
function OfferCard({
  offer,
  selected,
  busy,
  onSelect,
  onEdit,
  onToggle,
  onDelete,
}: {
  offer: Offer;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { form } = offer;
  return (
    <Box
      sx={{
        ...cardSx,
        p: 2,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 2,
        borderColor: selected ? tokens.color.primary : undefined,
      }}
    >
      <ButtonBase onClick={onSelect} sx={{ flex: 1, minWidth: 220, display: "block", textAlign: "left" }}>
        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{offerHeadline(form)}</Typography>
        <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>{offerDetail(form)}</Typography>
        <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
          {day(form.startDate)} – {day(form.endDate)} ·{" "}
          {form.customer === "First-time customer" ? "First-time customers" : "All passengers"}
        </Typography>
      </ButtonBase>
      <Box sx={{ display: "flex", gap: 1 }}>
        <ButtonBase disabled={busy} onClick={onEdit} sx={small}>
          Edit
        </ButtonBase>
        {offer.status !== "ended" && (
          <ButtonBase disabled={busy} onClick={onToggle} sx={small}>
            {offer.active ? "Pause" : "Resume"}
          </ButtonBase>
        )}
        <ButtonBase disabled={busy} onClick={onDelete} sx={{ ...small, color: tokens.color.error }}>
          Delete
        </ButtonBase>
      </Box>
    </Box>
  );
}

/**
 * Offers, from GET /restaurant/offers: status tabs with their counts, the
 * offers of the chosen tab, how the selected one did in the last seven days,
 * and a form to create an offer or change one.
 */
export function OffersView() {
  const toast = useToast(),
    [tab, setTab] = useState<OfferStatus>("live"),
    [page, setPage] = useState(1),
    [form, setForm] = useState<OfferForm>(emptyOfferForm),
    [editing, setEditing] = useState<string | null>(null),
    [picked, setPicked] = useState<string | null>(null),
    [problem, setProblem] = useState(""),
    { data, isFetching, error } = useGetOffersQuery({ status: tab, page }, { skip: DEMO_MODE }),
    rows = data?.rows ?? [],
    selected = rows.find((o) => o.id === picked) ?? rows[0],
    { data: metrics } = useGetOfferMetricsQuery(selected?.id ?? "", { skip: DEMO_MODE || !selected }),
    [create, { isLoading: creating }] = useCreateOfferMutation(),
    [update, { isLoading: updating }] = useUpdateOfferMutation(),
    [setActive, { isLoading: toggling }] = useSetOfferActiveMutation(),
    [remove, { isLoading: removing }] = useDeleteOfferMutation(),
    saving = creating || updating,
    busy = toggling || removing,
    set = <K extends keyof OfferForm>(key: K, value: OfferForm[K]) =>
      setForm((f) => ({ ...f, [key]: value })),
    headline = offerHeadline(form),
    prefix = valuePrefix(form.type),
    numeric = form.type !== "Free item",
    unit = (text?: string) =>
      text
        ? {
            startAdornment: <InputAdornment position="start">{text}</InputAdornment>,
          }
        : undefined;
  const reset = () => {
    setForm(emptyOfferForm());
    setEditing(null);
    setProblem("");
  };
  async function save() {
    const wrong = offerProblem(form);
    if (wrong) return setProblem(wrong);
    setProblem("");
    try {
      if (editing) await update({ id: editing, form }).unwrap();
      else await create(form).unwrap();
      toast.success(editing ? "Offer updated." : "Offer saved.");
      reset();
    } catch (e) {
      setProblem(errorMessage(e));
    }
  }
  async function act(run: () => Promise<unknown>, done: string) {
    try {
      await run();
      toast.success(done);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <ScreenSurface>
      <CountTabs
        label="Offers by status"
        value={tab}
        onChange={(next) => {
          setTab(next);
          setPage(1);
          setPicked(null);
        }}
        tabs={TABS.map((t) => ({ ...t, count: data?.counts[t.id] ?? 0 }))}
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
          {DEMO_MODE && <ToastAlert severity="info">Offers are not available in demo mode.</ToastAlert>}
          {error && <ToastAlert severity="error">{errorMessage(error)}</ToastAlert>}
          <Box
            sx={{
              display: "grid",
              gap: 2.5,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            }}
          >
            <StatTile
              label="Orders with offers"
              value={metrics ? metrics.orders.toLocaleString("en-IN") : "—"}
              note={selected ? "Selected offer · last 7 days" : "Last 7 days"}
            />
            <StatTile
              label="Discount you gave"
              value={metrics ? formatRupees(metrics.discount) : "—"}
              note="Comes out of your payout"
            />
            <StatTile
              label="Sales from offers"
              value={metrics ? formatRupees(metrics.sales) : "—"}
              note="Order value of those orders"
            />
          </Box>
          {rows.length === 0 ? (
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
              <LocalOfferOutlined sx={{ fontSize: 44, color: tokens.color.dashed }} />
              <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                {isFetching ? "Loading offers…" : `No ${TABS.find((t) => t.id === tab)?.label.toLowerCase()} offers`}
              </Typography>
              <Typography sx={{ maxWidth: 380, fontSize: 15, color: tokens.color.textMuted }}>
                Offers you create will be listed here.
              </Typography>
            </Box>
          ) : (
            rows.map((o) => (
              <OfferCard
                key={o.id}
                offer={o}
                selected={o.id === selected?.id}
                busy={busy}
                onSelect={() => setPicked(o.id)}
                onEdit={() => {
                  setForm(o.form);
                  setEditing(o.id);
                  setProblem("");
                }}
                onToggle={() =>
                  void act(
                    () => setActive({ id: o.id, active: !o.active }).unwrap(),
                    o.active ? "Offer paused." : "Offer is on again.",
                  )
                }
                onDelete={() => {
                  if (window.confirm("Delete this offer?"))
                    void act(() => remove(o.id).unwrap(), "Offer deleted.");
                }}
              />
            ))
          )}
          {data && data.pages > 1 && (
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
              <ButtonBase disabled={page <= 1} onClick={() => setPage((p) => p - 1)} sx={{ ...small, "&.Mui-disabled": { opacity: 0.4 } }}>
                Previous
              </ButtonBase>
              <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
                Page {data.page} of {data.pages}
              </Typography>
              <ButtonBase disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} sx={{ ...small, "&.Mui-disabled": { opacity: 0.4 } }}>
                Next
              </ButtonBase>
            </Box>
          )}
        </Box>
        <Box
          component="form"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          sx={{ ...cardSx, overflow: "hidden" }}
        >
          <Box sx={cardHeaderSx}>
            <Typography className="title">{editing ? "Edit offer" : "Create offer"}</Typography>
            <Typography className="subtitle">You fund the discount from your payout</Typography>
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
                helperText="% off, flat ₹ off or a free item"
              />
            </FormField>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
              <FormField label={valueLabel(form.type)} htmlFor="offer-value">
                <CommonTextField
                  id="offer-value"
                  value={form.value}
                  onChange={(e) =>
                    set("value", numeric ? e.target.value.replace(/\D/g, "") : e.target.value)
                  }
                  slotProps={{
                    htmlInput: {
                      inputMode: numeric ? "numeric" : "text",
                      maxLength: numeric ? 5 : 150,
                    },
                    input: unit(prefix),
                  }}
                />
              </FormField>
              <FormField label="Min order value" htmlFor="offer-min">
                <CommonTextField
                  id="offer-min"
                  value={form.minOrder}
                  onChange={(e) => set("minOrder", e.target.value.replace(/\D/g, ""))}
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
              <Typography sx={{ mt: 0.75, fontSize: 12, color: tokens.color.textSubtle }}>
                Offer shows only in this window each day
              </Typography>
            </FormField>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Type of customer</Typography>
              <RadioGroup
                value={form.customer}
                onChange={(e) => set("customer", e.target.value as OfferForm["customer"])}
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
            <Box sx={{ p: 2, borderRadius: "12px", bgcolor: tokens.color.muted }}>
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
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{headline}</Typography>
                    <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
                      {offerDetail(form)}
                    </Typography>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 14, color: tokens.color.textSubtle }}>
                    Fill in the discount to preview the offer.
                  </Typography>
                )}
              </Box>
            </Box>
            {problem && <Typography sx={{ fontSize: 13, color: tokens.color.error }}>{problem}</Typography>}
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
            <CommonButton variant="text" onClick={reset}>
              Cancel
            </CommonButton>
            <CommonButton variant="contained" type="submit" disabled={saving || DEMO_MODE}>
              {saving ? "Saving…" : editing ? "Save changes" : "Schedule offer"}
            </CommonButton>
          </Box>
        </Box>
      </Box>
    </ScreenSurface>
  );
}
