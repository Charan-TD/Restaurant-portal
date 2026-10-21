"use client";
import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { passwordRules } from "@/features/onboarding/models/validation";
import { errorMessage } from "@/shared/utils/errors";
import { resetPassword } from "../services/authService";
export function useResetPasswordViewModel() {
  const linkToken = useSearchParams().get("token") ?? "",
    [token, setToken] = useState(linkToken),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token.trim()) return setError("Enter the reset code from your email.");
    if (!passwordRules.every((rule) => rule.test(next)) || next.length > 128)
      return setError("Password does not meet all the requirements below.");
    if (next !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    setError("");
    try {
      await resetPassword(token.trim(), next);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return {
    /** True when the reset code came in the link, so it is not asked for. */
    hasLinkToken: !!linkToken,
    token,
    setToken,
    next,
    setNext,
    confirm,
    setConfirm,
    busy,
    error,
    done,
    submit,
  };
}
