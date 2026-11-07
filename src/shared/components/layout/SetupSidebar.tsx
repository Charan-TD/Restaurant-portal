"use client";
import { useRouter } from "next/navigation";
import { Box, ButtonBase, Typography } from "@mui/material";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import { usePortal } from "@/core/providers/PortalProvider";
import { steps } from "@/core/constants/onboarding";
import { cardSx, tokens } from "@/core/theme/tokens";

/** The setup list: a progress bar and the steps, each marked done or in progress. */
export function SetupSidebar() {
  const portal = usePortal(),
    router = useRouter(),
    done = portal.completed.filter((i) => i < steps.length).length,
    // The first step not saved yet. Steps are taken in order: a step opens
    // once it is saved, or when every step before it is.
    firstOpen = steps.findIndex((_, i) => !portal.completed.includes(i));
  return (
    <Box component="aside" sx={{ ...cardSx, p: 3, position: { md: "sticky" }, top: { md: 24 } }}>
      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
        Set up your restaurant
      </Typography>
      <Typography sx={{ mt: 0.5, fontSize: 12, color: tokens.color.textMuted }}>
        {done} of {steps.length} done · about 12 minutes
      </Typography>
      <Box
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={steps.length}
        aria-valuenow={done}
        sx={{ mt: 1.5, mb: 2.5, height: 4, borderRadius: 2, bgcolor: tokens.color.muted }}
      >
        <Box
          sx={{
            width: `${(done / steps.length) * 100}%`,
            height: "100%",
            borderRadius: 2,
            bgcolor: tokens.color.success,
            transition: "width .3s",
          }}
        />
      </Box>
      <Box component="nav" aria-label="Registration steps">
        {steps.map(({ id, title, hint }, i) => {
          const complete = portal.completed.includes(i),
            current = portal.currentStep === i,
            locked = !complete && firstOpen !== -1 && i > firstOpen;
          return (
            <Box key={id} sx={{ position: "relative" }}>
              {i < steps.length - 1 && (
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    left: 25,
                    top: 44,
                    bottom: -4,
                    width: 2,
                    bgcolor: complete ? tokens.color.success : tokens.color.border,
                  }}
                />
              )}
              <ButtonBase
                aria-current={current ? "step" : undefined}
                disabled={locked}
                title={locked ? "Save the step before to unlock this one" : undefined}
                onClick={() => {
                  portal.setCurrentStep(i);
                  router.push("/register");
                }}
                sx={{
                  width: "100%",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  alignItems: "flex-start",
                  gap: 1.5,
                  px: 1.25,
                  py: 1.25,
                  mb: 0.5,
                  borderRadius: "12px",
                  bgcolor: current ? tokens.color.primarySubtle : "transparent",
                  "&:hover": { bgcolor: current ? tokens.color.primarySubtle : tokens.color.sunken },
                  "&.Mui-disabled": { opacity: 0.45, cursor: "not-allowed", pointerEvents: "auto" },
                  "&.Mui-disabled:hover": { bgcolor: "transparent" },
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "50%",
                    fontSize: 13,
                    fontWeight: 600,
                    color: complete ? "#fff" : current ? tokens.color.primary : tokens.color.textMuted,
                    bgcolor: complete ? tokens.color.success : tokens.color.card,
                    border: `1.5px solid ${
                      complete
                        ? tokens.color.success
                        : current
                          ? tokens.color.primary
                          : tokens.color.borderInput
                    }`,
                  }}
                >
                  {complete ? <CheckOutlined sx={{ fontSize: 16 }} /> : i + 1}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>
                    {title}
                  </Typography>
                  <Typography sx={{ fontSize: 12, lineHeight: "16px", color: tokens.color.textMuted }}>
                    {hint}
                  </Typography>
                  {(complete || current) && (
                    <Typography
                      sx={{
                        fontSize: 12,
                        lineHeight: "16px",
                        fontWeight: 600,
                        color: complete ? tokens.color.success : tokens.color.primary,
                      }}
                    >
                      {complete ? "Done" : "In progress"}
                    </Typography>
                  )}
                </Box>
              </ButtonBase>
            </Box>
          );
        })}
      </Box>
      <Box
        sx={{
          mt: 1.5,
          pt: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontSize: 12,
          color: tokens.color.textMuted,
          borderTop: `1px solid ${tokens.color.borderSubtle}`,
        }}
      >
        <LockOutlined sx={{ fontSize: 14 }} />
        Saved as you go. Come back any time.
      </Box>
    </Box>
  );
}
