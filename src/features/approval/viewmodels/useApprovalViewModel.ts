"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import { API_PATHS, DEMO_MODE } from "@/core/constants/config";
import { stepIndex } from "@/core/constants/onboarding";
import { rememberedRegistration } from "@/features/onboarding/services/registrationApi";
import { useLazyGetApprovalQuery } from "../services/approvalApi";
import type { ApprovalStatus } from "../models/approval";
import { errorMessage } from "@/shared/utils/errors";
export function useApprovalViewModel() {
  const [loadApproval] = useLazyGetApprovalQuery(),
    portal = usePortal(),
    router = useRouter(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { setApproval } = portal;
  // After a page load the id is not in memory, but it is kept in this browser.
  const registrationId = portal.registrationId ?? rememberedRegistration();
  const [loading, setLoading] = useState(!DEMO_MODE);
  useEffect(() => {
    if (DEMO_MODE || !API_PATHS.approval) return;
    if (!registrationId) {
      // Nothing submitted from this browser: back to the number.
      router.replace("/login");
      return;
    }
    let active = true;
    loadApproval(registrationId)
      .unwrap()
      .then((value) => {
        if (active) setApproval(value);
      })
      .catch((e) => {
        if (!active) return;
        // 409: it was never submitted, so carry on with the steps instead.
        if ((e as { status?: number })?.status === 409) router.replace("/register");
        else setError(errorMessage(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadApproval, setApproval, registrationId, router]);
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
    portal.setCompleted((old) => old.filter((i) => i !== documents));
    router.push("/register");
  };
  /** Opens a step of the registration to change it. */
  const editStep = (step: number) => {
    portal.setCurrentStep(step);
    router.push("/register");
  };
  const continueToDashboard = () =>
    router.push(portal.authenticated ? "/dashboard" : "/login");
  /** Leaves the status screen; signing in again brings it back. */
  const close = () => router.push("/login");
  return {
    ...portal,
    loading,
    close,
    error,
    busy,
    refresh,
    preview,
    updateDocuments,
    editStep,
    continueToDashboard,
  };
}
