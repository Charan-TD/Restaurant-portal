"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import {
  steps,
  stepFields,
  LAST_STEP,
  type StepId,
} from "@/core/constants/onboarding";
import { submitRegistration } from "../services/registrationService";
import { errorMessage } from "@/shared/utils/errors";
import { registrationSchema } from "../models/validation";
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
    [busy, setBusy] = useState(false);
  const go = (step: number) => {
    portal.setCurrentStep(step);
    setError("");
  };
  async function next() {
    setError("");
    const isLast = portal.currentStep === LAST_STEP,
      id = steps[portal.currentStep].id;
    const valid = await portal.form.trigger(
      isLast ? undefined : stepFields[id],
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
    if (!isLast) {
      portal.setCompleted((old) =>
        old.includes(portal.currentStep) ? old : [...old, portal.currentStep],
      );
      go(portal.currentStep + 1);
      return;
    }
    setBusy(true);
    try {
      const { confirmAccountNumber, confirmPassword, ...payload } =
        registrationSchema.parse(portal.form.getValues());
      void confirmAccountNumber;
      void confirmPassword;
      const result = await submitRegistration(payload);
      portal.setApproval(result);
      portal.setCompleted(steps.map((_, i) => i));
      router.push("/status");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return { ...portal, go, next, error, busy };
}
