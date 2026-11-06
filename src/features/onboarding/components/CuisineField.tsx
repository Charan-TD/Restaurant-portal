"use client";
import { useState } from "react";
import type { ControllerRenderProps } from "react-hook-form";
import {
  Autocomplete,
  Chip,
  SvgIcon,
  type SvgIconProps,
  CircularProgress,
  createFilterOptions,
} from "@mui/material";
import type { Cuisine, RegistrationForm } from "../models/registration";
import { useCuisinesViewModel } from "../viewmodels/useCuisinesViewModel";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import { tokens } from "@/core/theme/tokens";
import { FormField } from "@/shared/components/form/FormField";
/** A plain outlined bowl: a flat rim over a round body on a small foot. */
function BowlIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <path
        d="M3 11h18c0 4.6-3.6 8-9 8s-9-3.4-9-8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 21h7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </SvgIcon>
  );
}
// Typing "i" suggests Indian (matches from the start).
const MAX = 3,
  SHOWN = 2;
const filterCuisines = createFilterOptions<Cuisine>({
  matchFrom: "start",
  stringify: (option) => option.name,
});
export function CuisineField({
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
  const vm = useCuisinesViewModel(),
    [focused, setFocused] = useState(false);
  const ids = Array.isArray(field.value) ? (field.value as string[]) : [];
  const selected = vm.cuisines.filter((cuisine) => ids.includes(cuisine.id));
  return (
    <FormField label={label} required>
      <Autocomplete
        className={className}
        multiple
        autoHighlight
        options={vm.cuisines}
        loading={vm.loading}
        filterOptions={filterCuisines}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        value={selected}
        popupIcon={<KeyboardArrowDownRounded />}
        getOptionDisabled={(option) => selected.length >= MAX && !ids.includes(option.id)}
        onChange={(_, value) => field.onChange(value.slice(0, MAX).map((v) => v.id))}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          field.onBlur();
        }}
        noOptionsText={vm.error || "No matching cuisine"}
        renderValue={(value, getItemProps) => {
          // Two chips and "+1" while resting; every chip while choosing.
          const visible = focused ? value : value.slice(0, SHOWN);
          return (
            <>
              {visible.map((option, index) => {
                const { key, ...itemProps } = getItemProps({ index });
                return (
                  <Chip key={key} size="small" label={option.name} {...itemProps} />
                );
              })}
              {value.length > visible.length && (
                <span style={{ fontSize: 13, color: tokens.color.textMuted }}>
                  +{value.length - visible.length}
                </span>
              )}
            </>
          );
        }}
        renderInput={(params) => (
          <CommonTextField
            {...params}
            name={field.name}
            inputRef={field.ref}
            placeholder={selected.length ? "" : "Search cuisines…"}
            error={!!error || !!vm.error}
            helperText={
              error ||
              (vm.error
                ? `Could not load cuisines: ${vm.error}`
                : "Pick up to 3. Passengers filter by these.")
            }
            slotProps={{
              ...params.slotProps,
              htmlInput: {
                ...params.slotProps.htmlInput,
                "aria-label": label,
              },
              formHelperText: { sx: { mx: 0 } },
              input: {
                ...params.slotProps.input,
                startAdornment: (
                  <>
                    <BowlIcon
                      sx={{ fontSize: 20, mr: 1, color: tokens.color.textSubtle }}
                    />
                    {params.slotProps.input.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {vm.loading && <CircularProgress size={18} />}
                    {params.slotProps.input.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
    </FormField>
  );
}
