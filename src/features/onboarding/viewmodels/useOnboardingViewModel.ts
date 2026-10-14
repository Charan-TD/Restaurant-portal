"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import {
  steps,
  stepFields,
  LAST_STEP,
  type StepId,
} from "@/core/constants/onboarding";
import { DEMO_MODE } from "@/core/constants/config";
import {
  forgetRegistration,
  loadRegistration,
  rememberRegistration,
  rememberedRegistration,
  saveRegistrationStep,
  submitRegistration,
} from "../services/registrationService";
import { errorMessage } from "@/shared/utils/errors";
import type { RegistrationForm } from "../models/registration";
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
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [restoring, setRestoring] = useState(false),
    [restored, setRestored] = useState(false),
    restoreStarted = useRef(false);
  const { form, registrationId, setRegistrationId, setCompleted } = portal,
    { setCurrentStep } = portal;
  // Coming back to an unfinished registration: reload what was saved and
  // continue from the first step that is not done yet.
  useEffect(() => {
    const savedId = rememberedRegistration();
    if (DEMO_MODE || registrationId || !savedId || restoreStarted.current)
      return;
    restoreStarted.current = true;
    setRestoring(true);
    loadRegistration(savedId)
      .then(({ completed, values }) => {
        form.reset({ ...form.getValues(), ...values });
        const done = steps
          .map((step, i) => (completed.includes(step.id) ? i : -1))
          .filter((i) => i >= 0);
        setRegistrationId(savedId);
        setCompleted(done);
        const next = steps.findIndex(
          (step, i) => i !== LAST_STEP && !done.includes(i),
        );
        setCurrentStep(next === -1 ? LAST_STEP : next);
        setRestored(done.length > 0);
      })
      .catch(() => forgetRegistration())
      .finally(() => setRestoring(false));
  }, [form, registrationId, setRegistrationId, setCompleted, setCurrentStep]);
  const keepId = (id: string | null) => {
    portal.setRegistrationId(id);
    if (id) rememberRegistration(id);
    return id;
  };
  const go = (step: number) => {
    portal.setCurrentStep(step);
    setError("");
  };
  async function next() {
    setError("");
    const isLast = portal.currentStep === LAST_STEP,
      id = steps[portal.currentStep].id;
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
    const check = matchChecks[id];
    if (
      check &&
      portal.form.getValues(check.field) !==
        portal.form.getValues(check.confirm)
    ) {
      portal.form.setError(
        check.confirm,
        { type: "validate", message: check.message },
        { shouldFocus: true },
      );
      setError("Please check the highlighted fields before continuing.");
      return;
    }
    setBusy(true);
    try {
      if (!isLast) {
        keepId(
          await saveRegistrationStep(
            id,
            portal.form.getValues(),
            portal.registrationId,
          ),
        );
        portal.setCompleted((old) =>
          old.includes(portal.currentStep) ? old : [...old, portal.currentStep],
        );
        go(portal.currentStep + 1);
        return;
      }
      const form = portal.form.getValues();
      // Save any step the vendor skipped past without "Save & continue".
      let registrationId = portal.registrationId;
      for (const [i, step] of steps.entries()) {
        if (i === LAST_STEP || portal.completed.includes(i)) continue;
        registrationId = await saveRegistrationStep(
          step.id,
          form,
          registrationId,
        );
        keepId(registrationId);
      }
      if (registrationId) await submitRegistration(registrationId);
      forgetRegistration();
      // Submitted; the admin portal now verifies the registration.
      portal.setApproval({
        status: "Under review",
        restaurantName: form.restaurantName,
      });
      portal.setCompleted(steps.map((_, i) => i));
      router.push("/status");
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
    restored,
    dismissRestored: () => setRestored(false),
  };
}
