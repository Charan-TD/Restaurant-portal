"use client";
import type { ControllerRenderProps } from "react-hook-form";
import { Box, ButtonBase, FormHelperText, Typography } from "@mui/material";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { tokens } from "@/core/theme/tokens";
import { FoodTypeMark } from "@/shared/components/feedback/FoodTypeMark";
import { foodTypes, type FoodType, type RegistrationForm } from "../models/registration";

const notes: Record<FoodType, string> = {
  Veg: "Vegetarian dishes",
  "Non-veg": "Chicken, mutton, fish",
  Egg: "Egg dishes",
};

/** Veg, Non-veg and Egg as three cards; pick every kind of food the kitchen serves. */
export function FoodServedField({
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
  const picked = Array.isArray(field.value) ? (field.value as FoodType[]) : [],
    toggle = (type: FoodType) =>
      field.onChange(
        picked.includes(type) ? picked.filter((t) => t !== type) : [...picked, type],
      );
  return (
    <Box className={className} role="group" aria-label={label}>
      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ mb: 1.5, fontSize: 13, color: tokens.color.textMuted }}>
        Pick all that apply
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {[...foodTypes].sort((a, b) => (a === "Egg" ? 1 : b === "Egg" ? -1 : 0)).map((type, i) => {
          const on = picked.includes(type);
          return (
            <ButtonBase
              key={type}
              role="checkbox"
              aria-checked={on}
              ref={i === 0 ? field.ref : undefined}
              onClick={() => toggle(type)}
              onBlur={field.onBlur}
              sx={{
                gap: 1.5,
                minHeight: 66,
                px: 1.75,
                justifyContent: "flex-start",
                textAlign: "left",
                borderRadius: "12px",
                bgcolor: on ? tokens.color.primarySubtle : tokens.color.card,
                border: `2px solid ${
                  on ? tokens.color.primary : error ? tokens.color.error : tokens.color.borderInput
                }`,
                transition: "background-color .2s ease, border-color .2s ease",
                "& .tick": {
                  opacity: on ? 1 : 0,
                  transform: on ? "scale(1)" : "scale(0.4)",
                  transition: "opacity .2s ease, transform .2s ease",
                },
              }}
            >
              <FoodTypeMark type={type} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{type}</Typography>
                <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
                  {notes[type]}
                </Typography>
              </Box>
              <CheckOutlined className="tick" sx={{ fontSize: 18, color: tokens.color.primary }} />
            </ButtonBase>
          );
        })}
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}
