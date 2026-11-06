"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import {
  steps,
  stepFields,
  stepIndex,
  LAST_STEP,
  type StepId,
} from "@/core/constants/onboarding";
import { DEMO_MODE } from "@/core/constants/config";
import {
  rememberRegistration,
  useSaveRegistrationStepMutation,
} from "../services/registrationApi";
import { useRestoreRegistration } from "./useRestoreRegistration";
import { errorMessage } from "@/shared/utils/errors";
import { verifiedPhone } from "@/features/auth/services/verifiedPhone";
import type { RegistrationForm } from "../models/registration";
import {
  makePreview,
  markSavedFiles,
  rememberExtras,
  type SavedFile,
} from "../services/registrationExtras";

/** Files of a step, as the form holds them, and the name each is saved under. */
const stepFiles: Partial<Record<StepId, [string, SavedFile][]>> = {
  details: [
    ["logo", "logo"],
    ["coverPhoto", "cover"],
  ],
  documents: [
    ["documents.gst", "gst"],
    ["documents.pan", "pan"],
    ["documents.fssai", "fssai"],
    ["documents.identity", "identity"],
    ["documents.businessProof", "businessProof"],
  ],
  bank: [["bankProof", "bankProof"]],
};
const matchChecks: Partial<
  Record<
    StepId,
    {
      field: keyof RegistrationForm;
      confirm: "confirmPassword" | "confirmAccountNumber";
      message: string;
    }
  >
> = {
  details: {
    field: "password",
    confirm: "confirmPassword",
    message: "Passwords must match.",
  },
  bank: {
    field: "accountNumber",
    confirm: "confirmAccountNumber",
    message: "Account numbers must match.",
  },
};
export function useOnboardingViewModel() {
  const portal = usePortal(),
    router = useRouter();
  const [loadError, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [saveStep] = useSaveRegistrationStepMutation();
  const { form } = portal;
  const restore = useRestoreRegistration({ toReviewWhenDone: true }),
    { restoring, loadFailed } = restore,
    error = loadError || restore.error;
  // Registration starts from a number verified by OTP on the sign-in page;
  // without one, go there first. The number then fills the form, locked.
  useEffect(() => {
    if (DEMO_MODE) return;
    const phone = verifiedPhone();
    if (!phone) {
      router.replace("/login");
      return;
    }
    if (form.getValues("mobile") !== phone)
      form.setValue("mobile", phone, { shouldValidate: false });
  }, [form, router]);
  // Reading this keeps the form's "changed" marks up to date.
  const changed = portal.form.formState.dirtyFields;
  const isChanged = (name: string) =>
    !!name
      .split(".")
      .reduce<unknown>(
        (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
        changed,
      );
  /** After a step is saved: remember what the backend will not hand back. */
  const afterSave = async (step: StepId, id: string, form: RegistrationForm) => {
    if (step === "details") {
      rememberExtras(id, {
        riderOwner: form.riderOwner || undefined,
        ...(form.logo ? { logoPreview: await makePreview(form.logo, 256) } : {}),
        ...(form.coverPhoto
          ? { coverPreview: await makePreview(form.coverPhoto, 640) }
          : {}),
      });
    }
    markSavedFiles(
      (stepFiles[step] ?? [])
        .filter(([name]) => portal.form.getValues(name as "logo") instanceof File)
        .map(([, file]) => file),
    );
  };
  const keepId = (id: string | null) => {
    portal.setRegistrationId(id);
    if (id) rememberRegistration(id);
    return id;
  };
  const go = (step: number) => {
    portal.setCurrentStep(step);
    setError("");
  };
  // The details step has no update endpoint: once saved it cannot be changed.
  const detailsLocked =
    !!portal.registrationId && portal.completed.includes(stepIndex("details"));
  /** Once every step is saved the vendor reviews and submits; before that, on to the next step. */
  const moveOn = (finished: number) => {
    if (steps.every((_, i) => i === finished || portal.completed.includes(i)))
      router.push("/review");
    else go(finished + 1);
  };
  async function next() {
    setError("");
    // Saving now would start a second registration beside the saved one.
    if (restoring || (loadFailed && !portal.registrationId)) {
      setError(
        restoring
          ? "Your saved registration is still loading. Please wait a moment."
          : "We could not load your saved registration, so nothing was saved. Refresh the page to try again.",
      );
      return;
    }
    const isLast = portal.currentStep === LAST_STEP,
      id = steps[portal.currentStep].id;
    // A step that is saved and untouched since it was loaded needs no check
    // and no save: its files are on the server, not in this browser.
    if (
      portal.completed.includes(portal.currentStep) &&
      !stepFields[id].some(isChanged) &&
      (!isLast || steps.every((_, i) => portal.completed.includes(i)))
    ) {
      moveOn(portal.currentStep);
      return;
    }
    // Saved steps may hold files and passwords the backend cannot send back,
    // so the final check covers only the steps that still need saving.
    const pending = steps.filter(
      (s, i) => i !== LAST_STEP && !portal.completed.includes(i),
    );
    const valid = await portal.form.trigger(
      isLast
        ? [...pending.flatMap((s) => stepFields[s.id]), ...stepFields[id]]
        : stepFields[id],
      { shouldFocus: true },
    );
    if (!valid) {
      if (isLast) {
        const firstInvalid = steps.findIndex((s) =>
          stepFields[s.id].some(
            (name) => portal.form.getFieldState(name).invalid,
          ),
        );
        if (firstInvalid >= 0) portal.setCurrentStep(firstInvalid);
      }
      setError("Please check the highlighted fields before continuing.");
      return;
    }
    // Every step about to be saved needs its "must match" check, including
    // earlier steps the vendor jumped past from the setup list.
    const toCheck = isLast ? [...pending.map((s) => s.id), id] : [id];
    for (const stepId of toCheck) {
      const check = matchChecks[stepId];
      if (
        check &&
        portal.form.getValues(check.field) !==
          portal.form.getValues(check.confirm)
      ) {
        if (isLast) portal.setCurrentStep(stepIndex(stepId));
        portal.form.setError(
          check.confirm,
          { type: "validate", message: check.message },
          { shouldFocus: true },
        );
        setError("Please check the highlighted fields before continuing.");
        return;
      }
    }
    setBusy(true);
    try {
      if (!isLast) {
        const saved = keepId(
          await saveStep({
            step: id,
            form: portal.form.getValues(),
            registrationId: portal.registrationId,
          }).unwrap(),
        );
        if (saved) await afterSave(id, saved, portal.form.getValues());
        portal.setCompleted((old) =>
          old.includes(portal.currentStep) ? old : [...old, portal.currentStep],
        );
        moveOn(portal.currentStep);
        return;
      }
      const form = portal.form.getValues();
      // Save the last step (it holds data: the operating hours) and any step
      // the vendor skipped past without "Save and continue". Submitting comes
      // after the review screen.
      let registrationId = portal.registrationId;
      for (const [i, step] of steps.entries()) {
        if (i !== LAST_STEP && portal.completed.includes(i)) continue;
        registrationId = await saveStep({
          step: step.id,
          form,
          registrationId,
        }).unwrap();
        keepId(registrationId);
        if (registrationId) await afterSave(step.id, registrationId, form);
      }
      portal.setCompleted(steps.map((_, i) => i));
      router.push("/review");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return {
    ...portal,
    go,
    next,
    error,
    busy,
    restoring,
    restored: restore.restored,
    detailsLocked,
    dismissRestored: restore.dismissRestored,
  };
}
