"use client";
import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import {
  Autocomplete,
  Chip,
  IconButton,
  InputAdornment,
  createFilterOptions,
} from "@mui/material";
import Visibility from "@mui/icons-material/VisibilityOutlined";
import VisibilityOff from "@mui/icons-material/VisibilityOffOutlined";
import { cuisineOptions, type RegistrationForm } from "../models/registration";
import { passwordRules } from "../models/validation";
import type { FieldDefinition } from "@/core/constants/onboarding";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { CommonSelect } from "@/shared/components/form/CommonSelect";
import { CommonRadioGroup } from "@/shared/components/form/CommonRadioGroup";
import { CommonCheckboxGroup } from "@/shared/components/form/CommonCheckboxGroup";
import { PasswordChecklist } from "./PasswordChecklist";
// Typing "i" suggests Indian, Italian, Indo-Chinese… (matches from the start).
const filterCuisines = createFilterOptions<string>({ matchFrom: "start" });
export function RegistrationField({
  definition,
}: {
  definition: FieldDefinition;
}) {
  const { control } = useFormContext<RegistrationForm>();
  const [showPassword, setShowPassword] = useState(false);
  const other = useWatch({
    control,
    name: definition.matches ?? definition.name,
  });
  return (
    <Controller
      control={control}
      name={definition.name}
      render={({ field, fieldState }) => {
        const className = definition.fullWidth ? "full" : undefined;
        if (definition.type === "radio")
          return (
            <CommonRadioGroup
              className={className}
              label={definition.label}
              name={field.name}
              required
              value={typeof field.value === "string" ? field.value : ""}
              options={definition.options || []}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          );
        if (definition.type === "checkboxes")
          return (
            <CommonCheckboxGroup
              className={className}
              label={definition.label}
              name={field.name}
              required
              value={
                Array.isArray(field.value) ? (field.value as string[]) : []
              }
              options={definition.options || []}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              helperText={
                fieldState.error?.message || "Select all that you serve."
              }
            />
          );
        if (definition.type === "cuisines") {
          const selected = Array.isArray(field.value)
            ? (field.value as string[])
            : [];
          return (
            <Autocomplete
              className={className}
              multiple
              freeSolo
              autoHighlight
              options={cuisineOptions as readonly string[]}
              filterOptions={filterCuisines}
              value={selected}
              onChange={(_, value) =>
                field.onChange(value.map((v) => v.trim()).filter(Boolean))
              }
              onBlur={field.onBlur}
              renderValue={(value, getItemProps) =>
                value.map((option, index) => {
                  const { key, ...itemProps } = getItemProps({ index });
                  return (
                    <Chip
                      key={key}
                      size="small"
                      label={option}
                      {...itemProps}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <CommonTextField
                  {...params}
                  label={definition.label}
                  required
                  name={field.name}
                  inputRef={field.ref}
                  placeholder={selected.length ? "" : "Search cuisines…"}
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message ||
                    "Type to search, e.g. “i” for Indian, Italian…"
                  }
                />
              )}
            />
          );
        }
        const value = typeof field.value === "string" ? field.value : "";
        const mismatch =
          !!definition.matches && value !== "" && value !== other;
        const matched = !!definition.matches && value !== "" && value === other;
        const isPassword = definition.type === "password";
        const props = {
          label: definition.label,
          required: true,
          name: field.name,
          inputRef: field.ref,
          value,
          onBlur: field.onBlur,
          onChange: (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => {
            const next = definition.sanitize
              ? definition.sanitize(e.target.value)
              : e.target.value;
            field.onChange(
              definition.maxLength ? next.slice(0, definition.maxLength) : next,
            );
          },
          error: !!fieldState.error || mismatch,
          helperText:
            fieldState.error?.message ||
            (mismatch
              ? `${definition.label.replace(/^Confirm /, "").replace(/^./, (c) => c.toUpperCase())}s do not match.`
              : matched
                ? "✓ Matches"
                : undefined),
        };
        if (definition.type === "select")
          return (
            <CommonSelect
              {...props}
              className={className}
              options={definition.options || []}
            />
          );
        const input = (
          <CommonTextField
            {...props}
            className={isPassword ? undefined : className}
            inputPrefix={definition.prefix}
            type={
              isPassword
                ? showPassword
                  ? "text"
                  : "password"
                : definition.type === "tel"
                  ? "tel"
                  : definition.type || "text"
            }
            multiline={definition.multiline}
            minRows={definition.multiline ? 3 : undefined}
            slotProps={{
              formHelperText: matched
                ? { sx: { color: "success.main" } }
                : undefined,
              htmlInput: {
                maxLength: definition.maxLength,
                inputMode: definition.inputMode,
                autoComplete: isPassword ? "new-password" : undefined,
              },
              input: {
                endAdornment: isPassword ? (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
        );
        if (isPassword && !definition.matches)
          return (
            <div className={className}>
              {input}
              <PasswordChecklist value={value} rules={passwordRules} />
            </div>
          );
        return input;
      }}
    />
  );
}
