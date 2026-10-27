"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { errorMessage } from "@/shared/utils/errors";
import { useRequestPasswordResetMutation } from "../services/authApi";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function useForgotPasswordViewModel() {
  const [requestPasswordReset] = useRequestPasswordResetMutation(),
    router = useRouter(),
    [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!EMAIL.test(email.trim())) return setError("Enter a valid email.");
    setBusy(true);
    setError("");
    try {
      const { token: issued } = await requestPasswordReset(
        email.trim(),
      ).unwrap();
      // The server returns the token for now, so go straight to the reset.
      if (issued) {
        router.push(`/reset-password?token=${encodeURIComponent(issued)}`);
        return;
      }
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return { email, setEmail, busy, error, sent, submit };
}
