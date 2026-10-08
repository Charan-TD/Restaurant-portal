"use client";
import { Controller } from "react-hook-form";
import { Typography, Tabs, Tab, InputAdornment, Link } from "@mui/material";
import MailOutline from "@mui/icons-material/MailOutlined";
import PhoneIphone from "@mui/icons-material/PhoneIphone";
import NextLink from "next/link";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { useLoginViewModel } from "../viewmodels/useLoginViewModel";
import type { LoginMethod } from "../models/auth";
const digits = (value: string, max: number) =>
  value.replace(/\D/g, "").slice(0, max);
export function LoginView() {
  const vm = useLoginViewModel();
  return (
    <CommonCard className="login">
      <div className="login-heading">
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
          Partner login
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to manage your restaurant, orders and payouts.
        </Typography>
      </div>
      <form noValidate onSubmit={vm.submit}>
        <Tabs
          value={vm.method}
          onChange={(_, value: LoginMethod) => vm.changeMethod(value)}
          variant="fullWidth"
          sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            value="email"
            icon={<MailOutline fontSize="small" />}
            iconPosition="start"
            label="Email & password"
          />
          <Tab
            value="phone"
            icon={<PhoneIphone fontSize="small" />}
            iconPosition="start"
            label="Phone & OTP"
          />
        </Tabs>
        {vm.method === "email" ? (
          <>
            <Controller
              name="email"
              control={vm.form.control}
              render={({ field }) => (
                <CommonTextField
                  {...field}
                  type="email"
                  label="Email"
                  autoComplete="email"
                />
              )}
            />
            <Controller
              name="password"
              control={vm.form.control}
              render={({ field }) => (
                <CommonTextField
                  {...field}
                  sx={{ mt: 3 }}
                  type="password"
                  label="Password"
                  autoComplete="current-password"
                />
              )}
            />
          </>
        ) : (
          <>
            <Controller
              name="phone"
              control={vm.form.control}
              render={({ field }) => (
                <CommonTextField
                  {...field}
                  onChange={(e) => field.onChange(digits(e.target.value, 10))}
                  type="tel"
                  label="Mobile number"
                  autoComplete="tel-national"
                  inputPrefix={COUNTRY_CODE}
                  slotProps={{
                    htmlInput: { inputMode: "numeric", maxLength: 10 },
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <CommonButton size="small" onClick={vm.sendOtp}>
                            {vm.otpSent ? "Resend OTP" : "Send OTP"}
                          </CommonButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
            />
            {vm.otpSent && (
              <Controller
                name="otp"
                control={vm.form.control}
                render={({ field }) => (
                  <CommonTextField
                    {...field}
                    onChange={(e) => field.onChange(digits(e.target.value, 6))}
                    sx={{ mt: 3 }}
                    label="OTP"
                    autoComplete="one-time-code"
                    helperText="Enter the 6-digit code sent to your phone."
                    slotProps={{
                      htmlInput: { inputMode: "numeric", maxLength: 6 },
                    }}
                  />
                )}
              />
            )}
          </>
        )}
        <CommonButton
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={vm.busy}
          sx={{ mt: 4 }}
        >
          {vm.busy ? "Signing in…" : "Log in"}
        </CommonButton>
      </form>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          mt: 3,
          pt: 3,
          borderTop: 1,
          borderColor: "divider",
          textAlign: "center",
        }}
      >
        New to Train Dhaba?{" "}
        <Link component={NextLink} href="/register" sx={{ fontWeight: 600 }}>
          Register your restaurant
        </Link>
      </Typography>
    </CommonCard>
  );
}
