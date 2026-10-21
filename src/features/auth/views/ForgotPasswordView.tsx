"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import NextLink from "next/link";
import { Link, Typography } from "@mui/material";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { useForgotPasswordViewModel } from "../viewmodels/useForgotPasswordViewModel";
export function ForgotPasswordView() {
  const vm = useForgotPasswordViewModel();
  return (
    <div className="login">
      <div className="login-body">
        <div className="login-heading">
          <span className="auth-eyebrow">Partner login</span>
          <h1 className="auth-title">Forgot password?</h1>
          <p>Enter your registered email and we will help you reset it.</p>
        </div>
        {vm.error && (
          <ToastAlert severity="error" sx={{ mb: 3 }}>
            {vm.error}
          </ToastAlert>
        )}
        {vm.sent ? (
          <>
            <ToastAlert severity="success" sx={{ mb: 3 }}>
              If this email is registered, a password reset link has been sent
              to it.
            </ToastAlert>
          </>
        ) : (
          <form noValidate onSubmit={vm.submit}>
            <CommonTextField
              type="email"
              label="Email"
              autoComplete="email"
              value={vm.email}
              onChange={(e) => vm.setEmail(e.target.value)}
            />
            <CommonButton
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={vm.busy || !vm.email}
              sx={{ mt: 4, minHeight: 52, fontSize: 16 }}
            >
              {vm.busy ? "Sending…" : "Send reset link"}
            </CommonButton>
          </form>
        )}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 3, textAlign: "center" }}
        >
          <Link component={NextLink} href="/login" sx={{ fontWeight: 600 }}>
            Back to login
          </Link>
        </Typography>
      </div>
    </div>
  );
}
