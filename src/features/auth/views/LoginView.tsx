"use client";
import type { FormEvent, ReactNode } from "react";
import NextLink from "next/link";
import { Box, ButtonBase, CircularProgress, Typography } from "@mui/material";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import SmartphoneOutlined from "@mui/icons-material/SmartphoneOutlined";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { BrandLogo } from "@/shared/components/layout/BrandLogo";
import { OtpInput } from "../components/OtpInput";
import { OTP_LENGTH, useLoginViewModel } from "../viewmodels/useLoginViewModel";

const INK = "#1c1c1c",
  MUTED = "#666666",
  ORANGE = "#ee5b00",
  FONT = "Inter, 'Noto Sans Devanagari', system-ui, sans-serif";

const perks = [
  "Payouts available up to 3 times a week",
  "No joining fee",
  "Get started within 1 working day",
];

const pill = {
  width: "100%",
  height: 52,
  gap: 1,
  borderRadius: 999,
  color: "#fff",
  fontSize: 16,
  fontWeight: 700,
  fontFamily: "inherit",
  background: `linear-gradient(90deg, ${ORANGE}, #c94a00)`,
  // Flat: no glow and no outline ring around the button.
  boxShadow: "none",
  border: 0,
  outline: "none",
  "&:focus, &:focus-visible, &.Mui-focusVisible": { outline: "none", boxShadow: "none" },
  "&.Mui-disabled": {
    color: "#a3a3a3",
    background: "#f0f0f0",
    boxShadow: "none",
  },
} as const;

function Brand() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <BrandLogo size={56} radius={14} />
      <Box>
        <Typography
          sx={{ fontSize: 22, lineHeight: "26px", fontWeight: 800, letterSpacing: "-0.3px", fontFamily: "inherit" }}
        >
          Train<Box component="span" sx={{ color: ORANGE }}>Dhaba</Box>
        </Typography>
        <Typography sx={{ fontSize: 12, lineHeight: "16px", fontWeight: 500, color: MUTED, fontFamily: "inherit" }}>
          Partner · Food at your seat
        </Typography>
      </Box>
    </Box>
  );
}

const Label = ({ children }: { children: ReactNode }) => (
  <Typography sx={{ fontSize: 14, lineHeight: "20px", fontWeight: 600, fontFamily: "inherit" }}>
    {children}
  </Typography>
);

/** Register or sign in with a mobile number: enter it, then the code sent to it. */
export function LoginView() {
  const vm = useLoginViewModel(),
    shown = `${COUNTRY_CODE} ${vm.phone.slice(0, 5)} ${vm.phone.slice(5)}`.trim();
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (vm.busy || vm.sending) return;
    void (vm.otpSent ? vm.submit() : vm.requestOtp());
  };
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: { xs: 2, sm: 3 },
        pt: { xs: 4, md: 8 },
        pb: 3,
        color: INK,
        fontFamily: FONT,
        background: "linear-gradient(160deg, #fff7f1 0%, #fff1e6 55%, #ffe9da 100%)",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: "url(/login-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <Box
        component="main"
        sx={{
          position: "relative",
          flex: 1,
          width: "100%",
          maxWidth: 1040,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            py: { xs: 3, md: 5 },
            bgcolor: "#fff",
            borderRadius: "28px",
            boxShadow: "0 20px 60px rgba(201,74,0,0.12), 0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <Box
            component="section"
            aria-label="About TrainDhaba Partner"
            sx={{
              flex: "1 1 380px",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 3.5,
              px: { xs: 3, md: 6 },
              py: 3,
            }}
          >
            <Brand />
            <Box sx={{ display: "grid", gap: 0.75 }}>
              <Typography
                component="h1"
                sx={{ fontSize: 32, lineHeight: "40px", fontWeight: 800, letterSpacing: "-0.4px", fontFamily: "inherit" }}
              >
                Welcome, partner!
              </Typography>
              <Typography sx={{ maxWidth: 360, fontSize: 15, lineHeight: "22px", color: MUTED, fontFamily: "inherit" }}>
                Feed passengers at your nearest station. Sign in to manage
                orders, menu and payouts.
              </Typography>
            </Box>
            <Box component="ul" sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gap: 1.75 }}>
              {perks.map((perk) => (
                <Box
                  component="li"
                  key={perk}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5, fontSize: 15, lineHeight: "22px" }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: 28,
                      height: 28,
                      flex: "none",
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      color: "#1b7f4b",
                      bgcolor: "#edf7f1",
                    }}
                  >
                    <CheckOutlined sx={{ fontSize: 16 }} />
                  </Box>
                  {perk}
                </Box>
              ))}
            </Box>
          </Box>
          <Box
            aria-hidden
            sx={{ display: { xs: "none", md: "block" }, width: "1px", alignSelf: "stretch", bgcolor: "#f0f0f0" }}
          />
          <Box
            component="section"
            aria-labelledby="si-h"
            sx={{
              flex: "1 1 380px",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              px: { xs: 3, md: 6 },
              py: 1,
            }}
          >
            <Box component="form" noValidate onSubmit={onSubmit} sx={{ display: "grid", gap: 2.5 }}>
              <Box sx={{ display: "grid", gap: 0.5 }}>
                <Typography
                  id="si-h"
                  component="h2"
                  sx={{ fontSize: 24, lineHeight: "32px", fontWeight: 700, fontFamily: "inherit" }}
                >
                  Register or log in
                </Typography>
                <Typography sx={{ fontSize: 14, lineHeight: "20px", color: MUTED, fontFamily: "inherit" }}>
                  Use the mobile number for your restaurant account
                </Typography>
              </Box>
              <Box sx={{ display: "grid", gap: 0.75 }}>
                <Box component="label" htmlFor="si-m">
                  <Label>Mobile number</Label>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    height: 48,
                    boxSizing: "border-box",
                    overflow: "hidden",
                    borderRadius: "12px",
                    bgcolor: vm.otpSent ? "#f7f8fa" : "#fff",
                    border: `1.5px solid ${vm.phoneError ? "#b3261e" : "#e6e6e6"}`,
                    "&:focus-within": { borderColor: INK },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      height: "100%",
                      px: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.75,
                      color: MUTED,
                      borderRight: "1px solid #f0f0f0",
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    <SmartphoneOutlined sx={{ fontSize: 16 }} />
                    <Box component="span" sx={{ color: INK }}>
                      {COUNTRY_CODE}
                    </Box>
                  </Box>
                  <Box
                    component="input"
                    id="si-m"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    autoFocus
                    placeholder="10-digit mobile number"
                    readOnly={vm.otpSent}
                    value={vm.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      vm.changePhone(e.target.value)
                    }
                    aria-invalid={!!vm.phoneError}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      height: "100%",
                      border: 0,
                      outline: 0,
                      px: 1.75,
                      fontSize: 15,
                      color: INK,
                      bgcolor: "transparent",
                      fontFamily: "inherit",
                      "&::placeholder": { color: "#8a8a8a" },
                    }}
                  />
                  {vm.otpSent && (
                    <ButtonBase
                      onClick={vm.changeNumber}
                      sx={{ px: 1.75, height: "100%", fontSize: 13, fontWeight: 600, color: "#c94a00" }}
                    >
                      Change
                    </ButtonBase>
                  )}
                </Box>
                {vm.phoneError && (
                  <Typography role="alert" sx={{ fontSize: 12, color: "#b3261e", fontFamily: "inherit" }}>
                    {vm.phoneError}
                  </Typography>
                )}
              </Box>
              {vm.otpSent && (
                <Box sx={{ display: "grid", gap: 0.75 }}>
                  <Label>Enter OTP sent to {shown}</Label>
                  <OtpInput
                    value={vm.otp}
                    onChange={vm.setOtp}
                    length={OTP_LENGTH}
                    disabled={vm.busy}
                  />
                  {vm.testOtp && (
                    <Box
                      role="status"
                      sx={{
                        mt: 0.5,
                        px: 1.5,
                        py: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontSize: 13,
                        borderRadius: "12px",
                        color: INK,
                        bgcolor: "#e8f0fe",
                        border: "1px solid #b7cdf5",
                        fontFamily: "inherit",
                      }}
                    >
                      Test OTP:
                      <Box component="b" sx={{ fontSize: 15, letterSpacing: "2px" }}>
                        {vm.testOtp}
                      </Box>
                    </Box>
                  )}
                  <Typography sx={{ fontSize: 12, lineHeight: "16px", color: MUTED, fontFamily: "inherit" }}>
                    {vm.wait > 0 ? (
                      `Resend OTP in 0:${String(vm.wait).padStart(2, "0")}`
                    ) : (
                      <ButtonBase
                        onClick={() => void vm.requestOtp()}
                        disabled={vm.sending}
                        sx={{ fontSize: 12, fontWeight: 600, color: "#c94a00" }}
                      >
                        Resend OTP
                      </ButtonBase>
                    )}
                  </Typography>
                </Box>
              )}
              {vm.error && (
                <Typography
                  role="alert"
                  sx={{
                    px: 1.5,
                    py: 1,
                    fontSize: 13,
                    borderRadius: "12px",
                    color: "#b3261e",
                    bgcolor: "#fdecea",
                    border: "1px solid #f1b8b3",
                    fontFamily: "inherit",
                  }}
                >
                  {vm.error}
                </Typography>
              )}
              <ButtonBase
                type="submit"
                disabled={
                  vm.busy ||
                  vm.sending ||
                  (vm.otpSent ? vm.otp.length !== OTP_LENGTH : vm.phone.length !== 10)
                }
                sx={pill}
              >
                {vm.busy || vm.sending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : vm.otpSent ? (
                  <LockOutlined sx={{ fontSize: 18 }} />
                ) : null}
                {vm.sending
                  ? "Sending OTP…"
                  : vm.busy
                    ? "Verifying…"
                    : vm.otpSent
                      ? "Verify and continue"
                      : "Send OTP"}
              </ButtonBase>
              <Typography sx={{ fontSize: 12, lineHeight: "16px", color: MUTED, textAlign: "center", fontFamily: "inherit" }}>
                By continuing you agree to the{" "}
                <NextLink
                  href="/terms"
                  style={{ color: "#c94a00", textDecoration: "underline" }}
                >
                  Partner terms
                </NextLink>{" "}
                and{" "}
                <NextLink
                  href="/privacy"
                  style={{ color: "#c94a00", textDecoration: "underline" }}
                >
                  Privacy policy
                </NextLink>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
