"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { useState, type FormEvent } from "react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Link, Typography } from "@mui/material";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { PasswordField } from "@/shared/components/form/PasswordField";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { passwordRules } from "@/features/onboarding/models/validation";
import { errorMessage } from "@/shared/utils/errors";
import { resetPassword } from "../services/authService";
export function ResetPasswordView() {
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
  return (
    <div className="login">
      <div className="login-body">
        <div className="login-heading">
          <span className="auth-eyebrow">Partner login</span>
          <h1 className="auth-title">Set a new password</h1>
          <p>Choose a strong password for your restaurant account.</p>
        </div>
        {error && (
          <ToastAlert severity="error" sx={{ mb: 3 }}>
            {error}
          </ToastAlert>
        )}
        {done ? (
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
          <form noValidate onSubmit={submit}>
            {!linkToken && (
              <Box sx={{ mb: 3 }}>
                <CommonTextField
                  label="Reset code"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </Box>
            )}
            <PasswordField
              showRules
              label="New password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <Box sx={{ mt: 3 }}>
              <PasswordField
                label="Confirm new password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Box>
            <CommonButton
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={busy || !next || !confirm}
              sx={{ mt: 4, minHeight: 52, fontSize: 16 }}
            >
              {busy ? "Saving…" : "Reset password"}
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
