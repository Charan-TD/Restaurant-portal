"use client";
import { useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField } from "@/shared/components/form/FormField";
import { FIELD_GROUPS } from "../models/changeRequestLabels";
import type { RestaurantDetails } from "../services/restaurantApi";
import {
  DOC_RULES,
  useDocumentsViewModel,
  type DocKey,
} from "../viewmodels/useDocumentsViewModel";
import { ChangeRequestForm } from "./ChangeRequestCard";
import { PaneHeading } from "./PaneHeading";
import { PaneFooter, PendingChip, SubHeading } from "./PaneParts";

const DAY = 24 * 60 * 60 * 1000;
/** The licence is flagged this many days before it runs out. */
export const WARN_DAYS = 30;
const AMBER = { text: "#8a5a00", bg: "#fff4d6", border: "#f5dd9b" };
const FORM_ID = "documents-form";

const dateText = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Days from today to the expiry date (negative once it has passed). */
export function daysLeft(iso?: string) {
  const time = iso ? Date.parse(iso) : NaN;
  if (Number.isNaN(time)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((time - today.getTime()) / DAY);
}

const caption = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: tokens.color.textMuted,
} as const;

function Fact({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={caption}>{label}</Typography>
      <Typography sx={{ fontWeight: 700, fontSize: 15, color }}>
        {value}
      </Typography>
    </Box>
  );
}

function VerifiedChip() {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: tokens.radius.badge,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.4px",
        color: tokens.color.success,
        bgcolor: tokens.color.successBg,
      }}
    >
      <CheckCircleOutlined sx={{ fontSize: 13 }} />
      VERIFIED
    </Box>
  );
}

/** The document on record: icon, its facts, and a button to view the file. */
function DocCard({
  facts,
  url,
  viewLabel,
  warn,
}: {
  facts: { label: string; value: string; color?: string }[];
  url?: string;
  viewLabel: string;
  warn?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
        p: 2,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.input,
      }}
    >
      <Box
        sx={{
          width: 44,
          height: 44,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "10px",
          color: warn ? AMBER.text : tokens.color.info,
          bgcolor: warn ? AMBER.bg : tokens.color.infoBg,
        }}
      >
        <DescriptionOutlined />
      </Box>
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        {facts.map((f) => (
          <Fact key={f.label} {...f} />
        ))}
      </Box>
      {url && (
        <Button
          variant="outlined"
          startIcon={<DescriptionOutlined />}
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          {viewLabel}
        </Button>
      )}
    </Box>
  );
}

/** A dashed box to choose or drop a file. */
function DocDropzone({
  title,
  file,
  onChange,
}: {
  title: string;
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null),
    [over, setOver] = useState(false);
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          input.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) onChange(dropped);
      }}
      sx={{
        py: 4,
        px: 2,
        display: "grid",
        justifyItems: "center",
        gap: 0.5,
        textAlign: "center",
        cursor: "pointer",
        borderRadius: tokens.radius.input,
        border: `1.5px dashed ${over ? tokens.color.primary : tokens.color.dashed}`,
        bgcolor: over ? tokens.color.primarySubtle : tokens.color.sunken,
        "&:focus-visible": { outline: `2px solid ${tokens.color.primary}` },
      }}
    >
      {file ? (
        <DescriptionOutlined sx={{ color: tokens.color.success }} />
      ) : (
        <FileUploadOutlined />
      )}
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
        {file ? file.name : title}
      </Typography>
      <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
        {file
          ? `${(file.size / 1024 / 1024).toFixed(2)} MB · click to replace`
          : "PDF, JPG or PNG · up to 2 MB"}
      </Typography>
      <input
        ref={input}
        hidden
        type="file"
        aria-label={`${title} file`}
        accept=".pdf,.jpg,.jpeg,.png"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) onChange(picked);
          e.target.value = "";
        }}
      />
    </Box>
  );
}

/** A row in "Other documents"; choosing it opens the same fields as the FSSAI licence. */
function DocRow({
  title,
  detail,
  verified,
  pending,
  open,
  onClick,
}: {
  title: string;
  detail?: string;
  verified: boolean;
  pending: boolean;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      type="button"
      aria-expanded={open}
      onClick={onClick}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.5,
        px: 0,
        font: "inherit",
        textAlign: "left",
        cursor: "pointer",
        border: 0,
        borderTop: `1px solid ${tokens.color.borderSubtle}`,
        bgcolor: "transparent",
        color: "inherit",
        "&:focus-visible": { outline: `2px solid ${tokens.color.primary}` },
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "10px",
          color: open ? tokens.color.primary : tokens.color.textMuted,
          bgcolor: open ? tokens.color.primarySubtle : tokens.color.muted,
        }}
      >
        <DescriptionOutlined fontSize="small" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography className="doc-title" sx={{ fontWeight: 600, fontSize: 15 }}>
          {title}
        </Typography>
        <Typography noWrap sx={{ fontSize: 13, color: tokens.color.textMuted }}>
          {detail || "Not added"}
        </Typography>
      </Box>
      {pending ? <PendingChip /> : verified && <VerifiedChip />}
      <ChevronRight
        sx={{
          color: tokens.color.textSubtle,
          transform: open ? "rotate(90deg)" : "none",
          transition: "transform .15s",
        }}
      />
    </Box>
  );
}

/** Business documents: the FSSAI licence, and the other documents, each renewed the same way. */
export function DocumentsPane({
  details,
  pending,
  onSent,
}: {
  details?: RestaurantDetails | null;
  /** Request fields now waiting for an admin; their rows are marked PENDING. */
  pending: ReadonlySet<string>;
  onSent: () => void;
}) {
  const vm = useDocumentsViewModel(onSent),
    [asking, setAsking] = useState(false),
    waiting = (group: readonly string[]) => group.some((f) => pending.has(f)),
    fssaiWaiting = waiting(FIELD_GROUPS.fssai),
    left = daysLeft(details?.fssaiExpiry),
    expired = left !== null && left < 0,
    soon = left !== null && left <= WARN_DAYS,
    // The profile's review status tells whether the documents were approved.
    verified = /approved|verified|active/i.test(details?.status ?? ""),
    docs = details?.documents,
    aadhaar = details?.aadhaarNumber;
  const status = fssaiWaiting
    ? { text: "Renewal pending approval", color: AMBER.text }
    : !details?.fssaiExpiry
      ? { text: details?.fssai ? "On file" : "Not added" }
      : expired
        ? { text: "Expired", color: tokens.color.error }
        : soon
          ? {
              text: `Expires in ${left} day${left === 1 ? "" : "s"}`,
              color: AMBER.text,
            }
          : { text: "Valid", color: tokens.color.success };

  /** The shared "new number" input (and valid-until for FSSAI) under a dropzone. */
  const renewFields = (doc: DocKey) => {
    const rule = DOC_RULES[doc],
      v = vm.values[doc];
    return (
      <>
        <DocDropzone
          title={`Upload ${doc === "fssai" ? "renewed licence" : `new ${rule.title.toLowerCase()}`}`}
          file={v.file}
          onChange={(file) => vm.set(doc, "file", file)}
        />
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              md: doc === "fssai" ? "repeat(2, minmax(0, 1fr))" : "1fr",
            },
          }}
        >
          <FormField
            label={`New ${rule.numberLabel}`}
            htmlFor={`${doc}-new-number`}
          >
            <CommonTextField
              id={`${doc}-new-number`}
              placeholder={rule.placeholder}
              value={v.number}
              onChange={(e) => {
                const raw = rule.numeric
                  ? e.target.value.replace(/\D/g, "")
                  : e.target.value;
                vm.set(
                  doc,
                  "number",
                  (rule.upper ? raw.toUpperCase() : raw).slice(
                    0,
                    rule.maxLength,
                  ),
                );
              }}
              slotProps={{
                htmlInput: { inputMode: rule.numeric ? "numeric" : "text" },
              }}
            />
          </FormField>
          {doc === "fssai" && (
            <FormField label="Valid until" htmlFor="fssai-new-expiry">
              <CommonTextField
                id="fssai-new-expiry"
                type="date"
                value={v.expiry}
                onChange={(e) => vm.set(doc, "expiry", e.target.value)}
              />
            </FormField>
          )}
        </Box>
      </>
    );
  };

  const others: {
    key: Exclude<DocKey, "fssai">;
    detail?: string;
    url?: string;
    group: readonly string[];
    type?: string;
  }[] = [
    {
      key: "pan",
      detail: details?.panNumber,
      url: docs?.pan,
      group: FIELD_GROUPS.pan,
    },
    {
      key: "gst",
      detail: details?.gstin,
      url: docs?.gst,
      group: FIELD_GROUPS.gst,
    },
    {
      key: "aadhaar",
      detail: aadhaar ? `Aadhaar ••${aadhaar.slice(-4)}` : undefined,
      url: docs?.aadhaar,
      group: FIELD_GROUPS.aadhaar,
    },
    {
      key: "businessProof",
      detail:
        [details?.businessProofType, details?.businessProofNumber]
          .filter(Boolean)
          .join(" · ") || undefined,
      url: docs?.businessProof,
      group: FIELD_GROUPS.businessProof,
      type: details?.businessProofType,
    },
  ];

  return (
    <>
      <PaneHeading
        title="Business documents"
        subtitle="Keep these valid to stay listed on TrainDhaba"
      />
      <Box sx={{ p: 3, display: "grid", gap: 3.5 }}>
        {soon && details?.fssaiExpiry && (
          <Box
            role="alert"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1.25,
              fontSize: 13,
              borderRadius: tokens.radius.input,
              color: AMBER.text,
              bgcolor: AMBER.bg,
              border: `1px solid ${AMBER.border}`,
            }}
          >
            <ErrorOutlined sx={{ fontSize: 18 }} />
            <span>
              <b>
                Your FSSAI licence {expired ? "expired" : "expires"} on{" "}
                {dateText(details.fssaiExpiry)}.
              </b>{" "}
              Upload the renewed licence {expired ? "now" : "before then"}, or
              your restaurant will be paused.
            </span>
          </Box>
        )}

        <form id={FORM_ID} noValidate onSubmit={vm.submit}>
          <Box sx={{ display: "grid", gap: 3.5 }}>
            <Box sx={{ display: "grid", gap: 2 }}>
              <SubHeading>FSSAI licence</SubHeading>
              {vm.sent && (
                <ToastAlert severity="success">
                  Request sent. An admin will review the new documents.
                </ToastAlert>
              )}
              {vm.error && <ToastAlert severity="error">{vm.error}</ToastAlert>}
              <DocCard
                warn={soon}
                url={docs?.fssai}
                viewLabel="View licence"
                facts={[
                  {
                    label: "Licence number",
                    value: details?.fssai || "Not added",
                  },
                  ...(details?.fssaiType
                    ? [{ label: "Type", value: details.fssaiType }]
                    : []),
                  {
                    label: "Valid until",
                    value: details?.fssaiExpiry
                      ? dateText(details.fssaiExpiry)
                      : "—",
                    color: soon ? AMBER.text : undefined,
                  },
                  {
                    label: "Status",
                    value: status.text,
                    color: status.color,
                  },
                ]}
              />
              {renewFields("fssai")}
            </Box>

            <Box>
              <SubHeading note="Choose a document to replace it.">
                Other documents
              </SubHeading>
              <Box sx={{ mt: -1 }}>
                {others.map((d) => {
                  const rule = DOC_RULES[d.key],
                    open = vm.selected === d.key,
                    wait = waiting(d.group);
                  return (
                    <Box key={d.key}>
                      <DocRow
                        title={rule.title}
                        detail={d.detail}
                        verified={verified && !!d.url}
                        pending={wait}
                        open={open}
                        onClick={() => vm.select(d.key)}
                      />
                      {open && (
                        <Box sx={{ display: "grid", gap: 2, pb: 2.5, pt: 0.5 }}>
                          <DocCard
                            url={d.url}
                            viewLabel="View document"
                            facts={[
                              {
                                label: `Current ${rule.numberLabel}`,
                                value:
                                  d.key === "aadhaar" && aadhaar
                                    ? `••${aadhaar.slice(-4)}`
                                    : (d.key === "businessProof"
                                        ? details?.businessProofNumber
                                        : d.detail) || "Not added",
                              },
                              ...(d.type
                                ? [{ label: "Type", value: d.type }]
                                : []),
                              {
                                label: "Status",
                                value: wait
                                  ? "Pending approval"
                                  : verified && d.url
                                    ? "Verified"
                                    : d.url
                                      ? "On file"
                                      : "Not added",
                                color: wait
                                  ? AMBER.text
                                  : verified && d.url
                                    ? tokens.color.success
                                    : undefined,
                              },
                            ]}
                          />
                          {renewFields(d.key)}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </form>

        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <SubHeading note="Restaurant or owner name changes wait for admin approval.">
              Request a name change
            </SubHeading>
            <CommonButton
              variant="outlined"
              onClick={() => setAsking((v) => !v)}
            >
              {asking ? "Close" : "Request a change"}
            </CommonButton>
          </Box>
          {asking && <ChangeRequestForm onSent={onSent} />}
        </Box>
      </Box>
      <PaneFooter>
        <CommonButton
          variant="text"
          onClick={vm.cancel}
          disabled={vm.busy || !vm.dirty}
        >
          Cancel
        </CommonButton>
        <CommonButton
          type="submit"
          form={FORM_ID}
          variant="contained"
          disabled={vm.busy || !vm.dirty}
        >
          {vm.busy ? "Saving…" : "Save changes"}
        </CommonButton>
      </PaneFooter>
    </>
  );
}
