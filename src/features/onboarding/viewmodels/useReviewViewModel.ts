"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWatch } from "react-hook-form";
import { usePortal } from "@/core/providers/PortalProvider";
import { steps } from "@/core/constants/onboarding";
import { DEMO_MODE } from "@/core/constants/config";
import { errorMessage } from "@/shared/utils/errors";
import { verifiedPhone } from "@/features/auth/services/verifiedPhone";
import { useSubmitRegistrationMutation } from "../services/registrationApi";
import { useRestoreRegistration } from "./useRestoreRegistration";

/** The last look before sending the registration for approval. */
export function useReviewViewModel() {
  const portal = usePortal(),
    router = useRouter(),
    restore = useRestoreRegistration({ toReviewWhenDone: false }),
    [submitRegistration] = useSubmitRegistrationMutation(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    data = useWatch({ control: portal.form.control }),
    allDone = steps.every((_, i) => portal.completed.includes(i)),
    { settled, restoring, loadFailed } = restore;
  // Only a verified number gets here; a registration that is not finished
  // goes back to the steps.
  useEffect(() => {
    if (!DEMO_MODE && !verifiedPhone()) router.replace("/login");
    else if (settled && !restoring && !loadFailed && !allDone)
      router.replace("/register");
  }, [router, settled, restoring, loadFailed, allDone]);
  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (!DEMO_MODE) {
        if (!portal.registrationId)
          throw new Error(
            "Your registration was not found. Please start again.",
          );
        await submitRegistration(portal.registrationId).unwrap();
      }
      portal.setApproval({
        status: "Under review",
        restaurantName: portal.form.getValues("restaurantName"),
        submittedAt: new Date().toISOString(),
      });
      router.push("/status");
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };
  const edit = (step: number) => {
    portal.setCurrentStep(step);
    router.push("/register");
  };
  return {
    data,
    ready: allDone,
    loading: !settled || restoring,
    error: error || restore.error,
    busy,
    submit,
    edit,
  };
}
