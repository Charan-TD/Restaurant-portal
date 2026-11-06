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
import { passwordRules, todayIso } from "../models/validation";
import { useVerifiedPhone } from "@/features/auth/services/verifiedPhone";

/**
 * The password rules as a five-part bar that fills as each one is met, and one
 * line saying what is still needed.
 */
function PasswordHints({ value, failed }: { value: string; failed: boolean }) {
  const met = passwordRules.filter((rule) => rule.test(value)),
    missing = passwordRules.filter((rule) => !rule.test(value)),
    done = missing.length === 0,
    color = done ? tokens.color.success : failed ? tokens.color.error : tokens.color.textMuted;
  return (
    <Box
      component="span"
      title="At least 8 characters, including 1 uppercase, 1 lowercase, 1 number, and 1 special character."
      sx={{ display: "block" }}
    >
      <Box component="span" aria-hidden sx={{ display: "flex", gap: 0.5, mt: 0.25, mb: 0.5 }}>
        {passwordRules.map((rule, i) => (
          <Box
            key={rule.short}
            component="span"
            sx={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              bgcolor: i < met.length ? tokens.color.success : tokens.color.border,
              transition: "background-color .2s",
            }}
          />
        ))}
      </Box>
      <Box component="span" sx={{ display: "block", color, fontWeight: done ? 600 : 400 }}>
        {done
          ? "✓ Strong password"
          : value
            ? `Still needed: ${missing.map((rule) => rule.short.toLowerCase()).join(", ")}`
            : "8+ characters · uppercase · lowercase · number · symbol"}
      </Box>
    </Box>
  );
}

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
            (definition.name === "password" ? (
              <PasswordHints value={value} failed={!!error} />
            ) : null) ||
            error ||
            (locked
              ? "Verified with OTP"
              : mismatch
                ? "These do not match."
                : matched && definition.matchText
                  ? (
                      <Box component="span" sx={{ fontWeight: 600, color: tokens.color.success }}>
                        {definition.matchText}
                      </Box>
                    )
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
                      {matched && (
                        <CheckOutlined sx={{ fontSize: 20, color: tokens.color.success }} />
                      )}
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
