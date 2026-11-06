"use client";
import type { ControllerRenderProps } from "react-hook-form";
import { Box, ButtonBase, FormHelperText, Typography } from "@mui/material";
import RadioButtonChecked from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import { tokens } from "@/core/theme/tokens";
import type { RegistrationForm, RiderOwner } from "../models/registration";

const options: {
  value: RiderOwner;
  title: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    value: "Traindhaba",
    title: "TrainDhaba rider",
    description:
      "We send a delivery partner to pick up and hand over at the coach.",
    recommended: true,
  },
  {
    value: "restaurant",
    title: "My own riders",
    description:
      "Your staff delivers to the coach. Add their name and phone for each order.",
  },
];

/** Asks who delivers the restaurant's orders to the train. */
export function RiderOwnerField({
  className,
  label,
  field,
  error,
}: {
  className?: string;
  label: string;
  field: ControllerRenderProps<RegistrationForm>;
  error?: string;
}) {
  return (
    <Box className={className} role="radiogroup" aria-label={label}>
      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ mb: 1.5, fontSize: 13, color: tokens.color.textMuted }}>
        Who takes the food from your outlet to the passenger&apos;s coach?
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        {options.map((option, i) => {
          const selected = field.value === option.value;
          return (
            <ButtonBase
              key={option.value}
              role="radio"
              aria-checked={selected}
              ref={i === 0 ? field.ref : undefined}
              onClick={() => field.onChange(option.value)}
              onBlur={field.onBlur}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1.25,
                p: 1.75,
                textAlign: "left",
                borderRadius: "12px",
                bgcolor: tokens.color.card,
                border: `${selected ? 2 : 1.5}px solid ${
                  selected
                    ? tokens.color.borderStrong
                    : error
                      ? tokens.color.error
                      : tokens.color.border
                }`,
              }}
            >
              {selected ? (
                <RadioButtonChecked sx={{ color: tokens.color.primary }} />
              ) : (
                <RadioButtonUnchecked sx={{ color: tokens.color.borderInput }} />
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    {option.title}
                  </Typography>
                  {option.recommended && (
                    <Box
                      component="span"
                      sx={{
                        px: 0.75,
                        borderRadius: "6px",
                        fontSize: 10,
                        lineHeight: "16px",
                        fontWeight: 700,
                        letterSpacing: "0.4px",
                        color: tokens.color.success,
                        bgcolor: tokens.color.successBg,
                      }}
                    >
                      RECOMMENDED
                    </Box>
                  )}
                </Box>
                <Typography sx={{ mt: 0.25, fontSize: 12, color: tokens.color.textMuted }}>
                  {option.description}
                </Typography>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}
