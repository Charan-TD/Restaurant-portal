"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { Controller } from "react-hook-form";
import {
  Typography,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
  Link,
} from "@mui/material";
import MailOutline from "@mui/icons-material/MailOutlined";
import PhoneIphone from "@mui/icons-material/PhoneIphone";
import Visibility from "@mui/icons-material/VisibilityOutlined";
import VisibilityOff from "@mui/icons-material/VisibilityOffOutlined";
import NextLink from "next/link";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { useLoginViewModel } from "../viewmodels/useLoginViewModel";
import type { LoginMethod } from "../models/auth";
const digits = (value: string, max: number) =>
  value.replace(/\D/g, "").slice(0, max);
export function LoginView() {
  const vm = useLoginViewModel();
  return (
    <div className="login">
      <div className="login-body">
        <div className="login-heading">
          <span className="auth-eyebrow">Partner login</span>
          <h1 className="auth-title">Welcome back</h1>
          <p>Sign in to manage your restaurant, orders and payouts.</p>
        </div>
        {vm.error && (
          <ToastAlert severity="error" sx={{ mb: 3 }}>
            {vm.error}
          </ToastAlert>
        )}
        <form noValidate onSubmit={vm.submit}>
          <Tabs
            value={vm.method}
            onChange={(_, value: LoginMethod) => vm.changeMethod(value)}
            variant="fullWidth"
            sx={{ mb: 4, borderBottom: 1, borderColor: "divider" }}
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
                render={({ field, fieldState }) => (
                  <CommonTextField
                    {...field}
                    type="email"
                    label="Email"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    autoComplete="email"
                  />
                )}
              />
              <Controller
                name="password"
                control={vm.form.control}
                render={({ field, fieldState }) => (
                  <CommonTextField
                    {...field}
                    sx={{ mt: 3 }}
                    type={vm.showPassword ? "text" : "password"}
                    label="Password"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    autoComplete="current-password"
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              edge="end"
                              onClick={vm.togglePassword}
                              onMouseDown={(e) => e.preventDefault()}
                              aria-label={
                                vm.showPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {vm.showPassword ? (
                                <VisibilityOff fontSize="small" />
                              ) : (
                                <Visibility fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
              <Typography variant="body2" sx={{ mt: 1.5, textAlign: "right" }}>
                <Link
                  component={NextLink}
                  href="/forgot-password"
                  sx={{ fontWeight: 600 }}
                >
                  Forgot password?
                </Link>
              </Typography>
            </>
          ) : (
            <>
              <Controller
                name="phone"
                control={vm.form.control}
                render={({ field, fieldState }) => (
                  <CommonTextField
                    {...field}
                    onChange={(e) => field.onChange(digits(e.target.value, 10))}
                    type="tel"
                    label="Mobile number"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    autoComplete="tel-national"
                    inputPrefix={COUNTRY_CODE}
                    slotProps={{
                      htmlInput: { inputMode: "numeric", maxLength: 10 },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <CommonButton
                              size="small"
                              onClick={vm.requestOtp}
                              disabled={vm.sendingOtp}
                            >
                              {vm.sendingOtp
                                ? "Sending…"
                                : vm.otpSent
                                  ? "Resend OTP"
                                  : "Send OTP"}
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
                  render={({ field, fieldState }) => (
                    <CommonTextField
                      {...field}
                      onChange={(e) =>
                        field.onChange(digits(e.target.value, 6))
                      }
                      sx={{ mt: 3 }}
                      label="OTP"
                      autoComplete="one-time-code"
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message ||
                        vm.otpHint ||
                        "Enter the 6-digit code sent to your phone."
                      }
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
            disabled={vm.busy || (vm.method === "phone" && !vm.otpSent)}
            sx={{ mt: 4, minHeight: 52, fontSize: 16 }}
          >
            {vm.busy ? "Signing in…" : "Log in"}
          </CommonButton>
        </form>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 3, textAlign: "center" }}
        >
          New to Train Dhaba?{" "}
          <Link component={NextLink} href="/register" sx={{ fontWeight: 600 }}>
            Register your restaurant
          </Link>
        </Typography>
      </div>
      <Typography
        variant="caption"
        color="text.secondary"
        className="login-foot"
      >
        Need help signing in? Contact Train Dhaba partner support.
      </Typography>
    </div>
  );
}
