"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import { initialLogin, type LoginForm, type LoginMethod } from "../models/auth";
export function useLoginViewModel() {
  const portal = usePortal(),
    router = useRouter(),
    [otpSent, setOtpSent] = useState(false),
    [busy, setBusy] = useState(false);
  const form = useForm<LoginForm>({
    defaultValues: {
      ...initialLogin,
      email: portal.form.getValues("email"),
      phone: portal.form.getValues("mobile"),
    },
  });
  const method = useWatch({ control: form.control, name: "method" });
  const changeMethod = (next: LoginMethod) => {
    form.setValue("method", next);
    setOtpSent(false);
  };
  // OTP delivery is not wired to a backend yet; this only reveals the OTP field.
  const sendOtp = () => setOtpSent(true);
  // No credential checks for now: any login opens the dashboard.
  const submit = form.handleSubmit(() => {
    setBusy(true);
    portal.setAuthenticated(true);
    form.reset({ ...form.getValues(), password: "", otp: "" });
    router.push("/dashboard");
  });
  return { form, method, changeMethod, otpSent, sendOtp, submit, busy };
}
