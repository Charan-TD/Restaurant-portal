"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import { steps, LAST_STEP } from "@/core/constants/onboarding";
import { API_PATHS, DEMO_MODE } from "@/core/constants/config";
import { useLazyGetApprovalQuery } from "@/features/approval/services/approvalApi";
import { errorMessage } from "@/shared/utils/errors";
import { verifiedPhone } from "@/features/auth/services/verifiedPhone";
import {
  forgetRegistration,
  rememberedRegistration,
  useLazyLoadRegistrationQuery,
} from "../services/registrationApi";
import {
  extrasFor,
  forgetExtras,
  setSavedFiles,
} from "../services/registrationExtras";

/** The backend keys a registration by UUID; anything else in storage is junk. */
const REGISTRATION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * After a page load, reloads the saved registration of this browser from the
 * backend: its values, which steps are done and which files are uploaded.
 * With `toReviewWhenDone`, a registration with every step done goes straight
 * to the review screen; otherwise it opens on the first step still to do.
 */
export function useRestoreRegistration({
  toReviewWhenDone,
}: {
  toReviewWhenDone: boolean;
}) {
  const portal = usePortal(),
    router = useRouter(),
    [loadRegistration] = useLazyLoadRegistrationQuery(),
    [loadApproval] = useLazyGetApprovalQuery(),
    [error, setError] = useState(""),
    [restoring, setRestoring] = useState(false),
    [restored, setRestored] = useState(false),
    [loadFailed, setLoadFailed] = useState(false),
    // True once there is nothing (more) to load, so a screen can decide.
    [settled, setSettled] = useState(false),
    started = useRef(false);
  const { form, registrationId, setRegistrationId, setCompleted } = portal,
    { setCurrentStep, setApproval } = portal;
  useEffect(() => {
    const savedId = rememberedRegistration();
    // Browser storage is only read here; state is set from a microtask.
    const settle = () => queueMicrotask(() => setSettled(true));
    if (DEMO_MODE || registrationId) {
      settle();
      return;
    }
    if (!savedId || started.current) {
      if (!savedId) settle();
      return;
    }
    if (!REGISTRATION_ID.test(savedId)) {
      forgetRegistration();
      settle();
      return;
    }
    started.current = true;
    queueMicrotask(() => setRestoring(true));
    loadRegistration(savedId)
      .unwrap()
      .then(({ completed, values, files }) => {
        // A registration saved here for another mobile number is not this
        // vendor's: start a fresh one instead of showing it.
        const phone = verifiedPhone();
        if (phone && values.mobile && values.mobile !== phone) {
          forgetRegistration();
          forgetExtras();
          setSavedFiles([]);
          return;
        }
        // What the backend does not send back comes from this browser.
        const extras = extrasFor(savedId);
        form.reset({
          ...form.getValues(),
          ...values,
          riderOwner: values.riderOwner || extras?.riderOwner || "",
        });
        setSavedFiles(files);
        const done = steps
          .map((step, i) => (completed.includes(step.id) ? i : -1))
          .filter((i) => i >= 0);
        setRegistrationId(savedId);
        setCompleted(done);
        const all = done.length === steps.length;
        const carryOn = () => {
          if (toReviewWhenDone && all) {
            router.replace("/review");
            return;
          }
          const next = steps.findIndex(
            (step, i) => i !== LAST_STEP && !done.includes(i),
          );
          setCurrentStep(next === -1 ? LAST_STEP : next);
          setRestored(done.length > 0);
        };
        if (!all || DEMO_MODE || !API_PATHS.approval) return carryOn();
        // Everything is filled in: if it was already sent for approval, show
        // where it stands. Only a rejected one goes back to be changed.
        return loadApproval(savedId)
          .unwrap()
          .then(
            (status) => {
              if (status.status === "Rejected") return carryOn();
              setApproval(status);
              router.replace("/status");
            },
            // 409: not submitted yet, so the review screen is next.
            () => carryOn(),
          );
      })
      .catch((e) => {
        // Only a registration the server no longer knows is dropped; any
        // other failure keeps it so a refresh can try again.
        if ((e as { status?: number })?.status === 404) forgetRegistration();
        else {
          setLoadFailed(true);
          setError(
            `We could not load your saved registration. ${errorMessage(e)} Refresh to try again.`,
          );
        }
        started.current = false;
      })
      .finally(() => {
        setRestoring(false);
        setSettled(true);
      });
  }, [
    form,
    router,
    toReviewWhenDone,
    registrationId,
    setRegistrationId,
    setCompleted,
    setCurrentStep,
    setApproval,
    loadRegistration,
    loadApproval,
  ]);
  return {
    error,
    restoring,
    restored,
    loadFailed,
    settled,
    dismissRestored: () => setRestored(false),
  };
}
