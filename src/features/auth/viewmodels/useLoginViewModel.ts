"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import { API_PATHS, DEMO_MODE } from "@/core/constants/config";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { errorMessage } from "@/shared/utils/errors";
import { getMyRestaurant } from "@/features/profile/services/restaurantService";
import { login, sendOtp, verifyOtp } from "../services/authService";
import {
  emailLoginSchema,
  initialLogin,
  type AuthSession,
  type LoginForm,
  type LoginMethod,
} from "../models/auth";
export function useLoginViewModel() {
  const portal = usePortal(),
    router = useRouter(),
    [otpSent, setOtpSent] = useState(false),
    [sendingOtp, setSendingOtp] = useState(false),
    [otpHint, setOtpHint] = useState(""),
    [error, setError] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [busy, setBusy] = useState(false);
  const form = useForm<LoginForm>({
    defaultValues: {
      ...initialLogin,
      email: portal.form.getValues("email"),
      phone: portal.form.getValues("mobile"),
    },
  });
  const method = useWatch({ control: form.control, name: "method" });
  const fullPhone = () => `${COUNTRY_CODE}${form.getValues("phone")}`;
  const changeMethod = (next: LoginMethod) => {
    form.setValue("method", next);
    form.clearErrors();
    setError("");
    setOtpSent(false);
    setOtpHint("");
  };
  const requestOtp = async () => {
    setError("");
    if (form.getValues("phone").length !== 10) {
      form.setError("phone", { message: "Enter a 10-digit mobile number." });
      return;
    }
    form.clearErrors("phone");
    if (DEMO_MODE) {
      setOtpSent(true);
      return;
    }
    setSendingOtp(true);
    try {
      const challenge = await sendOtp(fullPhone());
      setOtpSent(true);
      // Test backends echo the OTP back; production ones never do.
      setOtpHint(challenge.otp ? `Test OTP: ${challenge.otp}` : "");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSendingOtp(false);
    }
  };
  // Returns null when a field error was shown instead of calling the API.
  const authenticate = async (
    values: LoginForm,
  ): Promise<AuthSession | null> => {
    if (values.method === "email") {
      const parsed = emailLoginSchema.safeParse(values);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) =>
          form.setError(issue.path[0] as "email" | "password", {
            message: issue.message,
          }),
        );
        return null;
      }
      return login(parsed.data);
    }
    if (!/^\d{6}$/.test(values.otp)) {
      form.setError("otp", { message: "Enter the 6-digit OTP." });
      return null;
    }
    return verifyOtp(fullPhone(), values.otp);
  };
  const submit = form.handleSubmit(async (values) => {
    setError("");
    form.clearErrors();
    setBusy(true);
    try {
      // Demo mode keeps the original behaviour: any login opens the dashboard.
      const session = DEMO_MODE ? null : await authenticate(values);
      if (!DEMO_MODE && !session) {
        setBusy(false);
        return;
      }
      // What the vendor typed fills in whatever the response leaves out.
      const profile = session?.profile ?? {};
      portal.setProfile({
        ...profile,
        email:
          profile.email ??
          (values.method === "email" ? values.email.trim() : undefined),
        phone:
          profile.phone ??
          (values.method === "phone" ? fullPhone() : undefined),
      });
      // The login response may only carry the restaurant id; look up the
      // name in the background so the dashboard opens without waiting.
      if (API_PATHS.restaurantMe)
        void getMyRestaurant()
          .then((restaurant) => {
            if (restaurant.active !== undefined)
              portal.setOnline(restaurant.active);
            portal.setProfile((current) => ({
              ...current,
              restaurantName: current.restaurantName ?? restaurant.name,
              city: current.city ?? restaurant.city,
              name: current.name ?? restaurant.ownerName,
              phone: current.phone ?? restaurant.phone,
              email: current.email ?? restaurant.email,
            }));
          })
          .catch(() => undefined);
      portal.setAuthenticated(true);
      form.reset({ ...form.getValues(), password: "", otp: "" });
      router.push("/dashboard");
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  });
  return {
    form,
    method,
    changeMethod,
    showPassword,
    togglePassword: () => setShowPassword((shown) => !shown),
    otpSent,
    sendingOtp,
    otpHint,
    requestOtp,
    submit,
    busy,
    error,
  };
}
