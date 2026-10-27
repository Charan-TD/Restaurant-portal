"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import { API_PATHS, DEMO_MODE } from "@/core/constants/config";
import { stepIndex, LAST_STEP } from "@/core/constants/onboarding";
import { useLazyGetApprovalQuery } from "../services/approvalApi";
import type { ApprovalStatus } from "../models/approval";
import { errorMessage } from "@/shared/utils/errors";
export function useApprovalViewModel() {
  const [loadApproval] = useLazyGetApprovalQuery(),
    portal = usePortal(),
    router = useRouter(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { setApproval, registrationId } = portal;
  useEffect(() => {
    if (DEMO_MODE || !API_PATHS.approval || !registrationId) return;
    let active = true;
    loadApproval(registrationId)
      .unwrap()
      .then((value) => {
        if (active) setApproval(value);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [loadApproval, setApproval, registrationId]);
  const refresh = async () => {
    if (!registrationId) return;
    setBusy(true);
    setError("");
    try {
      portal.setApproval(await loadApproval(registrationId).unwrap());
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
