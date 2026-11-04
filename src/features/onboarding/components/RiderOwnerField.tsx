"use client";
import type { ReactNode } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import {
  Box,
  ButtonBase,
  Chip,
  FormHelperText,
  Typography,
} from "@mui/material";
import TrainOutlined from "@mui/icons-material/TrainOutlined";
import TwoWheelerOutlined from "@mui/icons-material/TwoWheelerOutlined";
import RadioButtonChecked from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import type { RegistrationForm, RiderOwner } from "../models/registration";

const options: {
  value: RiderOwner;
  title: string;
  description: string;
  icon: ReactNode;
  recommended?: boolean;
}[] = [
  {
    value: "Traindhaba",
    title: "TrainDhaba riders",
    description:
      "Our riders collect the order from you and deliver it to the passenger's seat.",
    icon: <TrainOutlined />,
    recommended: true,
  },
  {
    value: "restaurant",
    title: "Own riders",
    description:
      "Your own delivery staff take each order to the train. You add and assign them in the portal.",
    icon: <TwoWheelerOutlined />,
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
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {label} *
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
                gap: 1.5,
                p: 2,
                textAlign: "left",
                borderRadius: "12px",
                border: 2,
                borderColor: selected
                  ? "primary.main"
                  : error
                    ? "error.main"
                    : "divider",
                bgcolor: selected ? "rgba(242, 106, 46, 0.06)" : "transparent",
                transition: "border-color .15s, background-color .15s",
                "&:hover": { borderColor: "primary.light" },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  borderRadius: "10px",
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "#f3f4f2",
                  color: selected ? "primary.main" : "text.secondary",
                }}
              >
                {option.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    {option.title}
                  </Typography>
                  {option.recommended && (
                    <Chip
                      size="small"
                      color="success"
                      label="Recommended"
                      sx={{ height: 22, fontWeight: 600 }}
                    />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5 }}
                >
                  {option.description}
                </Typography>
              </Box>
              {selected ? (
                <RadioButtonChecked color="primary" />
              ) : (
                <RadioButtonUnchecked color="disabled" />
              )}
            </ButtonBase>
          );
        })}
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}
