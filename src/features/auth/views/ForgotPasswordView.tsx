"use client";
import { useState, type FormEvent } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Link, Typography } from "@mui/material";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { errorMessage } from "@/shared/utils/errors";
import { requestPasswordReset } from "../services/authService";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function ForgotPasswordView() {
  const router = useRouter(),
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
      const { token: issued } = await requestPasswordReset(email.trim());
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
  return (
    <div className="login">
      <div className="login-body">
        <div className="login-heading">
          <span className="auth-eyebrow">Partner login</span>
          <h1 className="auth-title">Forgot password?</h1>
          <p>Enter your registered email and we will help you reset it.</p>
        </div>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {sent ? (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              If this email is registered, a password reset link has been sent
              to it.
            </Alert>
          </>
        ) : (
          <form noValidate onSubmit={submit}>
            <CommonTextField
              type="email"
              label="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <CommonButton
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={busy || !email}
              sx={{ mt: 4, minHeight: 52, fontSize: 16 }}
            >
              {busy ? "Sending…" : "Send reset link"}
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
