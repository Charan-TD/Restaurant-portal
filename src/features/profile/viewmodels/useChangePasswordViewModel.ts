"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { passwordRules } from "@/features/onboarding/models/validation";
import { errorMessage } from "@/shared/utils/errors";
import { useChangePasswordMutation } from "../services/restaurantApi";
export function useChangePasswordViewModel() {
  const [changePassword] = useChangePasswordMutation(),
    router = useRouter(),
    [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  const clear = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setDone(false);
    if (!passwordRules.every((rule) => rule.test(next)) || next.length > 128)
      return setError("New password does not meet all the requirements below.");
    if (next !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    setError("");
    try {
      await changePassword({
        currentPassword: current,
        newPassword: next,
      }).unwrap();
      clear();
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const cancel = () => {
    clear();
    router.push("/dashboard");
  };
  return {
    current,
    setCurrent,
    next,
    setNext,
    confirm,
    setConfirm,
    busy,
    error,
    done,
    submit,
    cancel,
  };
}
