"use client";
import type { ReactNode } from "react";
import { Alert, Box, Typography } from "@mui/material";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { cardSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { useVerifiedPhone } from "@/features/auth/services/verifiedPhone";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { useApprovalViewModel } from "../viewmodels/useApprovalViewModel";
import type { ApprovalStatus } from "../models/approval";

const tone: Record<ApprovalStatus, { fg: string; bg: string }> = {
  "Under review": { fg: "#8a5a00", bg: "#fff4d6" },
  Approved: { fg: tokens.color.success, bg: tokens.color.successBg },
  Rejected: { fg: tokens.color.error, bg: tokens.color.errorBg },
};

/** "5 Nov 2026, 11:02". */
const when = (iso?: string) => {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}, ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
};

/** One line of the progress list: done, in progress or still to come. */
function Milestone({
  state,
  title,
  note,
  last,
}: {
  state: "done" | "active" | "todo";
  title: string;
  note?: ReactNode;
  last?: boolean;
}) {
  const color = state === "todo" ? tokens.color.borderInput : state === "done" ? tokens.color.success : "#c2410c";
  return (
    <Box sx={{ display: "flex", gap: 1.5, position: "relative", pb: last ? 0 : 2.5 }}>
      {!last && (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            left: 11,
            top: 26,
            bottom: 2,
            width: 2,
            bgcolor: state === "done" ? tokens.color.success : tokens.color.border,
          }}
        />
      )}
      <Box
        sx={{
          width: 24,
          height: 24,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          color: "#fff",
          bgcolor: state === "done" ? tokens.color.success : tokens.color.card,
          border: `2px solid ${color}`,
        }}
      >
        {state === "done" ? (
          <CheckOutlined sx={{ fontSize: 14 }} />
        ) : state === "active" ? (
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
        ) : null}
      </Box>
      <Box>
        <Typography sx={{ fontSize: 15, lineHeight: "24px", fontWeight: 600 }}>
          {title}
        </Typography>
        {note && (
          <Typography
            sx={{
              fontSize: 13,
              color: state === "active" ? color : tokens.color.textMuted,
              fontWeight: state === "active" ? 500 : 400,
            }}
          >
            {note}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/** What happens after submitting: under review, approved or not approved. */
export function ApprovalView() {
  const vm = useApprovalViewModel(),
    status = vm.approval?.status,
    saved = useVerifiedPhone(),
    mobile = saved || vm.form.getValues("mobile"),
    phone = mobile
      ? `${COUNTRY_CODE} ${mobile.slice(0, 5)} ${mobile.slice(5)}`
      : "your number";
  return (
    <>
      {vm.error && (
        <ToastAlert severity="error" sx={{ mb: 2 }}>
          {vm.error}
        </ToastAlert>
      )}
      {!status ? (
        vm.loading && !vm.error && <Alert severity="info">Checking your registration…</Alert>
      ) : (
        <Box
          sx={{
            ...cardSx,
            maxWidth: 560,
            mx: "auto",
            p: { xs: 3, md: 5 },
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              mx: "auto",
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              color: tone[status].fg,
              bgcolor: tone[status].bg,
            }}
          >
            {status === "Approved" ? (
              <CheckOutlined sx={{ fontSize: 34 }} />
            ) : status === "Rejected" ? (
              <ErrorOutlineOutlined sx={{ fontSize: 34 }} />
            ) : (
              <ScheduleOutlined sx={{ fontSize: 34 }} />
            )}
          </Box>
          <Box
            component="span"
            sx={{
              display: "inline-block",
              mt: 2,
              px: 1.25,
              borderRadius: "6px",
              fontSize: 11,
              lineHeight: "22px",
              fontWeight: 700,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
              color: tone[status].fg,
              bgcolor: tone[status].bg,
            }}
          >
            {status}
          </Box>
          <Typography component="h1" sx={{ mt: 1, fontSize: 24, lineHeight: "32px", fontWeight: 700 }}>
            {status === "Approved"
              ? "Your restaurant is approved"
              : status === "Rejected"
                ? "Application not approved"
                : "We’re reviewing your restaurant"}
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 15, color: tokens.color.textMuted }}>
            {status === "Approved"
              ? "Log in to open your restaurant and start receiving orders."
              : status === "Rejected"
                ? `${vm.approval?.reason || "Please review the feedback from your administrator."} Update your documents and resubmit.`
                : "Most reviews finish within 48 hours. We’ll notify you by SMS and email when you are live."}
          </Typography>
          {status === "Under review" && (
            <Box
              sx={{
                mt: 3,
                p: 2.5,
                textAlign: "left",
                borderRadius: "12px",
                border: `1px solid ${tokens.color.border}`,
              }}
            >
              <Milestone
                state="done"
                title="Submitted"
                note={when(vm.approval?.submittedAt)}
              />
              <Milestone state="active" title="Document checks" note="In progress" />
              <Milestone
                state="todo"
                title="Go live"
                note={`We will SMS ${phone}`}
                last
              />
            </Box>
          )}
          <Box sx={{ mt: 3, display: "grid", gap: 1.5 }}>
            {status === "Under review" && (
              <CommonButton variant="contained" fullWidth onClick={vm.close}>
                Close
              </CommonButton>
            )}
            {status === "Rejected" && (
              <CommonButton variant="contained" fullWidth onClick={vm.updateDocuments}>
                Update documents
              </CommonButton>
            )}
            {!DEMO_MODE && status === "Rejected" && (
              <CommonButton variant="outlined" fullWidth disabled={vm.busy} onClick={() => void vm.refresh()}>
                Refresh status
              </CommonButton>
            )}
          </Box>
        </Box>
      )}
      {DEMO_MODE && status && (
        <Box sx={{ mt: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <Typography variant="caption">Preview admin decision</Typography>
          {(["Under review", "Approved", "Rejected"] as ApprovalStatus[]).map((s) => (
            <CommonButton size="small" key={s} onClick={() => vm.preview(s)}>
              {s}
            </CommonButton>
          ))}
        </Box>
      )}
    </>
  );
}
