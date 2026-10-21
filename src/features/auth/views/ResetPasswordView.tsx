"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import NextLink from "next/link";
import { Box, Link, Typography } from "@mui/material";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { PasswordField } from "@/shared/components/form/PasswordField";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { useResetPasswordViewModel } from "../viewmodels/useResetPasswordViewModel";
export function ResetPasswordView() {
  const vm = useResetPasswordViewModel();
  return (
    <div className="login">
      <div className="login-body">
        <div className="login-heading">
          <span className="auth-eyebrow">Partner login</span>
          <h1 className="auth-title">Set a new password</h1>
          <p>Choose a strong password for your restaurant account.</p>
        </div>
        {vm.error && (
          <ToastAlert severity="error" sx={{ mb: 3 }}>
            {vm.error}
          </ToastAlert>
        )}
        {vm.done ? (
          <>
            <ToastAlert severity="success" sx={{ mb: 3 }}>
              Password reset. You can now log in with your new password.
            </ToastAlert>
            <CommonButton
              variant="contained"
              fullWidth
              size="large"
              component={NextLink}
              href="/login"
            >
              Go to login
            </CommonButton>
          </>
        ) : (
          <form noValidate onSubmit={vm.submit}>
            {!vm.hasLinkToken && (
              <Box sx={{ mb: 3 }}>
                <CommonTextField
                  label="Reset code"
                  value={vm.token}
                  onChange={(e) => vm.setToken(e.target.value)}
                />
              </Box>
            )}
            <PasswordField
              showRules
              label="New password"
              autoComplete="new-password"
              value={vm.next}
              onChange={(e) => vm.setNext(e.target.value)}
            />
            <Box sx={{ mt: 3 }}>
              <PasswordField
                label="Confirm new password"
                autoComplete="new-password"
                value={vm.confirm}
                onChange={(e) => vm.setConfirm(e.target.value)}
              />
            </Box>
            <CommonButton
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={vm.busy || !vm.next || !vm.confirm}
              sx={{ mt: 4, minHeight: 52, fontSize: 16 }}
            >
              {vm.busy ? "Saving…" : "Reset password"}
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
