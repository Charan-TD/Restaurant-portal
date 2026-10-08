"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { stepIndex, LAST_STEP } from "@/core/constants/onboarding";
import { getApproval } from "../services/approvalService";
import type { ApprovalStatus } from "../models/approval";
import { errorMessage } from "@/shared/utils/errors";
export function useApprovalViewModel() {
  const portal = usePortal(),
    router = useRouter(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { setApproval } = portal;
  useEffect(() => {
    if (DEMO_MODE) return;
    let active = true;
    getApproval()
      .then((value) => {
        if (active) setApproval(value);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [setApproval]);
  const refresh = async () => {
    setBusy(true);
    setError("");
    try {
      portal.setApproval(await getApproval());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const preview = (status: ApprovalStatus) => {
    if (DEMO_MODE)
      portal.setApproval({
        status,
        restaurantName: portal.form.getValues("restaurantName"),
        reason:
          status === "Rejected"
            ? "We couldn't verify business ownership for this location."
            : undefined,
      });
  };
  const updateDocuments = () => {
    const documents = stepIndex("documents");
    portal.setCurrentStep(documents);
    portal.setCompleted((old) =>
      old.filter((i) => i !== documents && i !== LAST_STEP),
    );
    router.push("/register");
  };
  const continueToDashboard = () =>
    router.push(portal.authenticated ? "/dashboard" : "/login");
  return {
    ...portal,
    error,
    busy,
    refresh,
    preview,
    updateDocuments,
    continueToDashboard,
  };
}
