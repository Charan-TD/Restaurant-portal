"use client";
import { Alert, Box, Typography } from "@mui/material";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { cardSx, tokens } from "@/core/theme/tokens";
import { useReviewViewModel } from "../viewmodels/useReviewViewModel";
import { SubmissionSummary, summaryOf } from "../components/SubmissionSummary";

/** Review and edit: every section as saved, then Proceed sends it for approval. */
export function ReviewView() {
  const vm = useReviewViewModel();
  return (
    <Box sx={{ ...cardSx, p: { xs: 2.5, md: 3.5 } }}>
      <Typography component="h1" sx={{ mb: 1.5, fontSize: 18, fontWeight: 700 }}>
        What you submitted
      </Typography>
      {vm.loading && <Alert severity="info">Loading your registration…</Alert>}
      {vm.error && (
        <ToastAlert severity="error" sx={{ mb: 2 }}>
          {vm.error}
        </ToastAlert>
      )}
      {vm.ready && (
        <>
          <SubmissionSummary rows={summaryOf(vm.data)} onEdit={vm.edit} />
          <Typography sx={{ mt: 1.5, fontSize: 12, color: tokens.color.textMuted }}>
            You can change these until the check starts. After that, contact
            Help.
          </Typography>
          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <CommonButton
              variant="contained"
              disabled={vm.busy}
              onClick={() => void vm.submit()}
            >
              {vm.busy ? "Submitting…" : "Proceed"}
            </CommonButton>
          </Box>
        </>
      )}
    </Box>
  );
}
