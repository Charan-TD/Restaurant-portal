"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/core/providers/PortalProvider";
import { API_PATHS, DEMO_MODE } from "@/core/constants/config";
import {
  COUNTRY_CODE,
  initialRegistration,
} from "@/features/onboarding/models/registration";
import { errorMessage } from "@/shared/utils/errors";
import { useLazyGetMyRestaurantQuery } from "@/features/profile/services/restaurantApi";
import { useSendOtpMutation, useVerifyOtpMutation } from "../services/authApi";
import {
  forgetRegistration,
  rememberRegistration,
} from "@/features/onboarding/services/registrationApi";
import { forgetExtras } from "@/features/onboarding/services/registrationExtras";
import {
  forgetVerifiedPhone,
  rememberVerifiedPhone,
} from "../services/verifiedPhone";

export const OTP_LENGTH = 6;
/** Seconds before the vendor may ask for another code. */
const RESEND_AFTER = 30;
/** Same rule as the registration form, so a number that signs in can register. */
const PHONE = /^[6-9]\d{9}$/;

/**
 * Sign in or register with a mobile number and a one-time code. A number with
 * a restaurant account goes to the dashboard; a new one goes on to register.
 */
export function useLoginViewModel() {
  const [loadRestaurant] = useLazyGetMyRestaurantQuery(),
    [sendOtp] = useSendOtpMutation(),
    [verifyOtp] = useVerifyOtpMutation(),
    portal = usePortal(),
    router = useRouter(),
    [phone, setPhone] = useState(""),
    [otp, setOtp] = useState(""),
    [otpSent, setOtpSent] = useState(false),
    [sending, setSending] = useState(false),
    [busy, setBusy] = useState(false),
    // Test backends send the code back; it is shown so the number can be verified.
    [testOtp, setTestOtp] = useState(""),
    [phoneError, setPhoneError] = useState(""),
    [error, setError] = useState(""),
    [wait, setWait] = useState(0);
  const fullPhone = `${COUNTRY_CODE}${phone}`;
  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);
  const changePhone = (value: string) => {
    setPhone(value.replace(/\D/g, "").slice(0, 10));
    setPhoneError("");
  };
  const requestOtp = async () => {
    setError("");
    if (!PHONE.test(phone)) {
      setPhoneError("Enter a valid 10-digit mobile number.");
      return;
    }
    setPhoneError("");
    setOtp("");
    if (DEMO_MODE) {
      setOtpSent(true);
      setWait(RESEND_AFTER);
      return;
    }
    setSending(true);
    try {
      const challenge = await sendOtp(phone).unwrap();
      setTestOtp(challenge.otp ?? "");
      setOtpSent(true);
      setWait(RESEND_AFTER);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSending(false);
    }
  };
  /** Back to the number, e.g. when it was typed wrong. */
  const changeNumber = () => {
    setOtpSent(false);
    setOtp("");
    setTestOtp("");
    setError("");
    setWait(0);
  };
  const submit = async () => {
    setError("");
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the ${OTP_LENGTH}-digit code.`);
      return;
    }
    setBusy(true);
    try {
      // Demo mode keeps the original behaviour: any code opens the dashboard.
      const session = DEMO_MODE
        ? null
        : await verifyOtp({ phone, otp }).unwrap();
      if (session?.isNewUser || session?.registration) {
        // Verified, but no restaurant yet. The server says whether this number
        // is new, has a registration part-way done, or has one under review.
        rememberVerifiedPhone(phone);
        portal.form.setValue("mobile", phone);
        const saved = session.registration;
        if (saved) rememberRegistration(saved.id);
        else forgetRegistration();
        // What this browser kept belongs to whoever used it last.
        if (!saved || saved.id !== portal.registrationId) {
          forgetExtras();
          portal.setRegistrationId(null);
          portal.setCompleted([]);
          portal.setCurrentStep(0);
          portal.setApproval(null);
          portal.form.reset(initialRegistration);
          portal.form.setValue("mobile", phone);
        }
        router.push(saved?.next === "review" ? "/status" : "/register");
        return;
      }
      // A signed-in restaurant has nothing left to register.
      forgetRegistration();
      forgetExtras();
      forgetVerifiedPhone();
      const profile = session?.profile ?? {};
      portal.setProfile({ ...profile, phone: profile.phone ?? fullPhone });
      // The login response may only carry the restaurant id; look up the
      // name in the background so the dashboard opens without waiting.
      if (API_PATHS.restaurantMe)
        void loadRestaurant()
          .unwrap()
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
      router.push("/dashboard");
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };
  return {
    phone,
    changePhone,
    phoneError,
    otp,
    setOtp,
    otpSent,
    sending,
    busy,
    testOtp,
    error,
    wait,
    requestOtp,
    changeNumber,
    submit,
  };
}
