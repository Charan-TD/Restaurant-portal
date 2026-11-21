"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import { API_PATHS, DEMO_MODE } from "@/core/constants/config";
import { setRegistrationToken } from "@/core/api/session";
import { forgetVerifiedPhone } from "@/features/auth/services/verifiedPhone";
import {
  forgetRegistration,
  rememberedRegistration,
} from "@/features/onboarding/services/registrationApi";
import {
  forgetExtras,
  setSavedFiles,
} from "@/features/onboarding/services/registrationExtras";
import { useLazyGetApprovalQuery } from "../services/approvalApi";
import type { ApprovalStatus } from "../models/approval";
import { errorMessage } from "@/shared/utils/errors";
// The status screen runs on the registration token (valid for two hours, and
// only for the status lookup). Approval does not change this screen: it gives
// the vendor a real login, which comes from verifying the number again. So a
// 401 here means "sign in again", and that sign-in opens the dashboard if the
// restaurant has been approved.
const SIGN_IN_AGAIN =
  "Your session has ended. If your restaurant has been approved, sign in with your mobile number to open your dashboard.";
// Once approved, the backend refuses the registration token and asks for the
// restaurant's own access ("This restaurant is approved; use restaurant access
// to continue"): signing in with the mobile number gives it.
const APPROVED_SIGN_IN =
  "Your restaurant is approved. Sign in with your mobile number to open your dashboard.";
const isApproved = (e: unknown) =>
  /approved.*restaurant access/i.test(errorMessage(e));
const statusError = (e: unknown) =>
  isApproved(e)
    ? APPROVED_SIGN_IN
    : (e as { status?: number })?.status === 401
      ? SIGN_IN_AGAIN
      : errorMessage(e);
// An approved restaurant has no draft left: drop what is saved for it and go
// to sign in, which gives the restaurant's own access.
function signInToContinue(router: { replace: (url: string) => void }) {
  forgetRegistration();
  forgetExtras();
  setSavedFiles([]);
  setRegistrationToken(null);
  forgetVerifiedPhone();
  router.replace("/login");
}
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
        else if (isApproved(e)) signInToContinue(router);
        else setError(statusError(e));
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
      if (isApproved(e)) signInToContinue(router);
      else setError(statusError(e));
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
  /** The review page: every step as saved, each with its own Edit button. */
  const editRegistration = () => router.push("/review");
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
    editRegistration,
    editStep,
    continueToDashboard,
  };
}
