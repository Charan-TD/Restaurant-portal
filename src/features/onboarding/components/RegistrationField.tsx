"use client";
import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Box, IconButton, InputAdornment, MenuItem, TextField } from "@mui/material";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import LockOutlined from "@mui/icons-material/LockOutlined";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import PhoneIphoneOutlined from "@mui/icons-material/PhoneIphoneOutlined";
import RestaurantOutlined from "@mui/icons-material/RestaurantOutlined";
import TagOutlined from "@mui/icons-material/TagOutlined";
import MailOutlined from "@mui/icons-material/MailOutlined";
import PersonOutline from "@mui/icons-material/PersonOutlineOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import type { RegistrationForm } from "../models/registration";
import { fieldGroups, type FieldDefinition } from "@/core/constants/onboarding";
import { tokens } from "@/core/theme/tokens";
import { FormField, prefixAdornment } from "@/shared/components/form/FormField";
import { CuisineField } from "./CuisineField";
import { FoodServedField } from "./FoodServedField";
import { RiderOwnerField } from "./RiderOwnerField";
import { todayIso } from "../models/validation";
import { useVerifiedPhone } from "@/features/auth/services/verifiedPhone";

const icons = {
  restaurant: <StorefrontOutlined sx={{ fontSize: 20 }} />,
  owner: <PersonOutline sx={{ fontSize: 20 }} />,
  email: <MailOutlined sx={{ fontSize: 20 }} />,
  dining: <RestaurantOutlined sx={{ fontSize: 20 }} />,
  phone: <PhoneIphoneOutlined sx={{ fontSize: 20 }} />,
  hash: <TagOutlined sx={{ fontSize: 20 }} />,
  calendar: <CalendarTodayOutlined sx={{ fontSize: 20 }} />,
  bank: <AccountBalanceOutlined sx={{ fontSize: 20 }} />,
  lock: <LockOutlined sx={{ fontSize: 20 }} />,
};

/** One registration field, with its label above it as the design shows. */
export function RegistrationField({
  definition,
}: {
  definition: FieldDefinition;
}) {
  const { control } = useFormContext<RegistrationForm>(),
    verified = useVerifiedPhone(),
    [shown, setShown] = useState(false),
    // The first step has no red stars, as its design shows.
    onFirstStep = !!fieldGroups.details?.includes(definition),
    // The mobile number was verified by OTP at sign-in, so it cannot change.
    locked = definition.name === "mobile" && !!verified,
    other = useWatch({ control, name: definition.matches ?? definition.name });
  return (
    <Controller
      control={control}
      name={definition.name}
      render={({ field, fieldState }) => {
        const className = definition.fullWidth ? "full" : undefined,
          error = fieldState.error?.message;
        if (definition.type === "checkboxes")
          return (
            <FoodServedField
              className={className}
              label={definition.label}
              field={field}
              error={error}
            />
          );
        if (definition.type === "cuisines")
          return (
            <CuisineField
              className={className}
              label={definition.label}
              field={field}
              error={error}
            />
          );
        if (definition.type === "riders")
          return (
            <RiderOwnerField
              className={className}
              label={definition.label}
              field={field}
              error={error}
            />
          );
        const value = typeof field.value === "string" ? field.value : "",
          matched = !!definition.matches && value !== "" && value === other,
          mismatch = !!definition.matches && value !== "" && value !== other,
          id = `reg-${field.name}`,
          password = definition.type === "password",
          // The verified number reads like 98450 22331.
          display =
            locked && value.length > 5 ? `${value.slice(0, 5)} ${value.slice(5)}` : value,
          helper =
            error ||
            (locked
              ? "Verified with OTP"
              : mismatch
                ? "These do not match."
                : matched && definition.matchText
                  ? definition.matchText
                  : definition.hint),
          start = definition.prefix ? (
            prefixAdornment(definition.prefix)
          ) : definition.icon ? (
            <InputAdornment position="start" sx={{ color: tokens.color.textSubtle }}>
              {icons[definition.icon]}
            </InputAdornment>
          ) : undefined;
        return (
          <FormField
            label={definition.label}
            htmlFor={id}
            required={!definition.optional && !onFirstStep}
            note={definition.labelNote}
            info={
              definition.name === "password"
                ? (
                    <Box component="span" sx={{ display: "block" }}>
                      <Box component="span" sx={{ display: "block", mb: 0.5, fontWeight: 700 }}>
                        Password must have
                      </Box>
                      <Box component="span" sx={{ display: "block", color: tokens.color.textMuted }}>
                        At least 8 characters
                        <br />1 capital and 1 small letter
                        <br />1 number
                        <br />1 symbol, like @ # $
                      </Box>
                    </Box>
                  )
                : undefined
            }
          >
            <TextField
              fullWidth
              select={definition.type === "select"}
              disabled={locked}
              id={id}
              name={field.name}
              inputRef={field.ref}
              value={display}
              placeholder={definition.placeholder}
              type={
                definition.type === "date" || definition.type === "email"
                  ? definition.type
                  : password
                    ? shown
                      ? "text"
                      : "password"
                    : definition.type === "tel"
                    ? "tel"
                    : "text"
              }
              onBlur={field.onBlur}
              onChange={(e) => {
                const next = definition.sanitize
                  ? definition.sanitize(e.target.value)
                  : e.target.value;
                field.onChange(
                  definition.maxLength
                    ? next.slice(0, definition.maxLength)
                    : next,
                );
              }}
              error={!!error || mismatch}
              helperText={helper}
              slotProps={{
                htmlInput: {
                  maxLength: definition.maxLength,
                  min:
                    definition.name === "documentNumbers.fssaiExpiry"
                      ? todayIso()
                      : undefined,
                  inputMode: definition.inputMode,
                  onClick:
                    definition.type === "date"
                      ? (e: { currentTarget: HTMLInputElement }) => {
                          try {
                            e.currentTarget.showPicker();
                          } catch {
                            // Typing the date still works.
                          }
                        }
                      : undefined,
                  "aria-label": definition.label,
                },
                select: { displayEmpty: true, IconComponent: KeyboardArrowDownRounded },
                input: {
                  readOnly: locked,
                  startAdornment: start,
                  endAdornment: definition.type === "date" ? (
                    <InputAdornment position="end" sx={{ color: tokens.color.success }}>
                      <CalendarMonthOutlined sx={{ fontSize: 20 }} />
                    </InputAdornment>
                  ) : password ? (
                    <InputAdornment position="end" sx={{ gap: 0.5 }}>
                      <IconButton
                        size="small"
                        edge="end"
                        aria-label={shown ? "Hide password" : "Show password"}
                        onClick={() => setShown((v) => !v)}
                      >
                        {shown ? (
                          <VisibilityOffOutlined sx={{ fontSize: 20 }} />
                        ) : (
                          <VisibilityOutlined sx={{ fontSize: 20 }} />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ) : matched ? (
                    <InputAdornment position="end">
                      <CheckOutlined sx={{ fontSize: 20, color: tokens.color.success }} />
                    </InputAdornment>
                  ) : undefined,
                  sx: {
                    ...(locked ? { bgcolor: tokens.color.sunken } : {}),
                    ...(definition.type === "date"
                      ? {
                          cursor: "pointer",
                          "& input": { cursor: "pointer" },
                          "& input::-webkit-calendar-picker-indicator": { display: "none" },
                        }
                      : {}),
                  },
                },
                formHelperText: { sx: { mx: 0 } },
              }}
            >
              {definition.type === "select" && [
                <MenuItem key="" value="" disabled>
                  <Box component="span" sx={{ color: tokens.color.textSubtle }}>
                    {definition.placeholder ?? "Select"}
                  </Box>
                </MenuItem>,
                ...(definition.options ?? []).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                )),
              ]}
            </TextField>
          </FormField>
        );
      }}
    />
  );
}
