"use client";
import { useRef, useState } from "react";
import { Box, Button, Link, Typography } from "@mui/material";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField } from "@/shared/components/form/FormField";
import { FIELD_GROUPS } from "../models/changeRequestLabels";
import type { RestaurantDetails } from "../services/restaurantApi";
import { useFssaiRenewalViewModel } from "../viewmodels/useFssaiRenewalViewModel";
import { ChangeRequestForm } from "./ChangeRequestCard";
import { PaneHeading } from "./PaneHeading";
import { PaneFooter, PendingChip, SubHeading } from "./PaneParts";

const DAY = 24 * 60 * 60 * 1000;
/** The licence is flagged this many days before it runs out. */
export const WARN_DAYS = 30;
const AMBER = { text: "#8a5a00", bg: "#fff4d6", border: "#f5dd9b" };
const FORM_ID = "fssai-renewal";

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

function DocRow({
  title,
  detail,
  url,
  verified,
  pending,
}: {
  title: string;
  detail?: string;
  url?: string;
  verified: boolean;
  pending: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        py: 1.5,
        borderTop: `1px solid ${tokens.color.borderSubtle}`,
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
          color: tokens.color.textMuted,
          bgcolor: tokens.color.muted,
        }}
      >
        <DescriptionOutlined fontSize="small" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 15 }}>{title}</Typography>
        <Typography noWrap sx={{ fontSize: 13, color: tokens.color.textMuted }}>
          {detail || (url ? "On file" : "Not added")}
        </Typography>
      </Box>
      {url && (
        <Link
          href={url}
          target="_blank"
          rel="noreferrer"
          underline="none"
          sx={{ fontSize: 14, fontWeight: 600, color: tokens.color.link }}
        >
          View
        </Link>
      )}
      {pending ? <PendingChip /> : verified && <VerifiedChip />}
    </Box>
  );
}

/** A dashed box to choose or drop the renewed licence. */
function LicenceDropzone({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null),
    [over, setOver] = useState(false);
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label="Upload renewed licence"
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
        "&:hover": { borderColor: tokens.color.primary },
        "&:focus-visible": { outline: `2px solid ${tokens.color.primary}` },
      }}
    >
      {file ? (
        <DescriptionOutlined sx={{ color: tokens.color.success }} />
      ) : (
        <FileUploadOutlined />
      )}
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
        {file ? file.name : "Upload renewed licence"}
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
        aria-label="Renewed licence file"
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

/** The documents on record, the FSSAI renewal, and a form to ask for other changes. */
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
  const vm = useFssaiRenewalViewModel(onSent),
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
          <Box sx={{ display: "grid", gap: 2 }}>
            <SubHeading>FSSAI licence</SubHeading>
            {vm.sent && (
              <ToastAlert severity="success">
                Renewal sent. An admin will review the new licence.
              </ToastAlert>
            )}
            {vm.error && <ToastAlert severity="error">{vm.error}</ToastAlert>}
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
                  color: soon ? AMBER.text : tokens.color.info,
                  bgcolor: soon ? AMBER.bg : tokens.color.infoBg,
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
                <Fact
                  label="Licence number"
                  value={details?.fssai || "Not added"}
                />
                {details?.fssaiType && (
                  <Fact label="Type" value={details.fssaiType} />
                )}
                <Fact
                  label="Valid until"
                  value={
                    details?.fssaiExpiry ? dateText(details.fssaiExpiry) : "—"
                  }
                  color={soon ? AMBER.text : undefined}
                />
                <Fact
                  label="Status"
                  value={status.text}
                  color={status.color}
                />
              </Box>
              {docs?.fssai && (
                <Button
                  variant="outlined"
                  startIcon={<DescriptionOutlined />}
                  href={docs.fssai}
                  target="_blank"
                  rel="noreferrer"
                >
                  View licence
                </Button>
              )}
            </Box>
            <LicenceDropzone
              file={vm.values.file}
              onChange={(file) => vm.set("file", file)}
            />
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              <FormField label="New licence number" htmlFor="fssai-new-number">
                <CommonTextField
                  id="fssai-new-number"
                  placeholder="14-digit number"
                  value={vm.values.number}
                  onChange={(e) =>
                    vm.set("number", e.target.value.replace(/\D/g, "").slice(0, 14))
                  }
                  slotProps={{ htmlInput: { inputMode: "numeric" } }}
                />
              </FormField>
              <FormField label="Valid until" htmlFor="fssai-new-expiry">
                <CommonTextField
                  id="fssai-new-expiry"
                  type="date"
                  value={vm.values.expiry}
                  onChange={(e) => vm.set("expiry", e.target.value)}
                />
              </FormField>
            </Box>
          </Box>
        </form>

        <Box>
          <SubHeading>Other documents</SubHeading>
          <Box sx={{ mt: -1 }}>
            <DocRow
              title="PAN card"
              detail={details?.panNumber}
              url={docs?.pan}
              verified={verified && !!docs?.pan}
              pending={waiting(FIELD_GROUPS.pan)}
            />
            <DocRow
              title="GST certificate"
              detail={details?.gstin}
              url={docs?.gst}
              verified={verified && !!docs?.gst}
              pending={waiting(FIELD_GROUPS.gst)}
            />
            <DocRow
              title="Identity proof"
              detail={aadhaar ? `Aadhaar ••${aadhaar.slice(-4)}` : undefined}
              url={docs?.aadhaar}
              verified={verified && !!docs?.aadhaar}
              pending={waiting(FIELD_GROUPS.aadhaar)}
            />
            <DocRow
              title="Business proof"
              detail={
                [details?.businessProofType, details?.businessProofNumber]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              url={docs?.businessProof}
              verified={verified && !!docs?.businessProof}
              pending={waiting(FIELD_GROUPS.businessProof)}
            />
          </Box>
        </Box>

        <Box>
          <Box
            sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}
          >
            <SubHeading note="Changes wait for admin approval and stay unchanged until approved.">
              Request a change
            </SubHeading>
            <CommonButton
              variant="outlined"
              onClick={() => setAsking((v) => !v)}
            >
              {asking ? "Close" : "Request a change"}
            </CommonButton>
          </Box>
          {asking && <ChangeRequestForm onSent={onSent} details={details} />}
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
