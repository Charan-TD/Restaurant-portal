"use client";
import { Typography, Chip, Alert } from "@mui/material";
import AccessTime from "@mui/icons-material/AccessTime";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutlined";
import Link from "next/link";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { DEMO_MODE } from "@/core/constants/config";
import { useApprovalViewModel } from "../viewmodels/useApprovalViewModel";
import type { ApprovalStatus } from "../models/approval";
export function ApprovalView() {
  const vm = useApprovalViewModel(),
    status = vm.approval?.status;
  return (
    <>
      <div className="page-heading">
        <Typography variant="overline">APPLICATION STATUS</Typography>
        <Typography variant="h4">Verification</Typography>
      </div>
      {vm.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {vm.error}
        </Alert>
      )}
      {!status ? (
        <CommonCard>
          <Typography>No submitted application in this session.</Typography>
          <Link href="/register">Go to restaurant setup</Link>
        </CommonCard>
      ) : (
        <CommonCard className="status">
          <AccessTime sx={{ fontSize: 48 }} />
          <Chip
            label={status}
            color={
              status === "Approved"
                ? "success"
                : status === "Rejected"
                  ? "error"
                  : "default"
            }
          />
          <Typography variant="h5">
            {status === "Approved"
              ? "You're approved to sell on Train Dhaba"
              : status === "Rejected"
                ? "Application not approved"
                : "We're reviewing your restaurant"}
          </Typography>
          <Typography color="text.secondary">
            {status === "Approved"
              ? "Log in to open your restaurant and start receiving orders."
              : status === "Rejected"
                ? `${vm.approval?.reason || "Please review the feedback from your administrator."} Update your business proof and resubmit.`
                : "Your application has been submitted. Your admin will check your documents, menu and listing."}
          </Typography>
          {status === "Under review" && (
            <div className="timeline">
              {[
                "Submitted",
                "Document checks",
                "Menu & listing review",
                "Go live",
              ].map((text, i) => (
                <div key={text}>
                  <CheckCircleOutline
                    color={i === 0 ? "success" : "disabled"}
                  />
                  <span>
                    {text}
                    <small>
                      {i === 0
                        ? "Completed"
                        : i === 1
                          ? "In progress"
                          : "Pending"}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          )}
          {status === "Rejected" && (
            <CommonButton variant="contained" onClick={vm.updateDocuments}>
              Update documents
            </CommonButton>
          )}
          {status === "Approved" && (
            <CommonButton variant="contained" onClick={vm.continueToDashboard}>
              {vm.authenticated ? "Go to dashboard" : "Go to login"}
            </CommonButton>
          )}
        </CommonCard>
      )}
      {DEMO_MODE && status && (
        <div className="demo-control">
          <Typography variant="caption">Preview admin decision</Typography>
          {(["Under review", "Approved", "Rejected"] as ApprovalStatus[]).map(
            (s) => (
              <CommonButton size="small" key={s} onClick={() => vm.preview(s)}>
                {s}
              </CommonButton>
            ),
          )}
        </div>
      )}
      {!DEMO_MODE && (
        <CommonButton disabled={vm.busy} onClick={() => void vm.refresh()}>
          Refresh status
        </CommonButton>
      )}
    </>
  );
}
