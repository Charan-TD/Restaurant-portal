"use client";
import type { ControllerRenderProps } from "react-hook-form";
import {
  Autocomplete,
  Chip,
  CircularProgress,
  createFilterOptions,
} from "@mui/material";
import type { Cuisine, RegistrationForm } from "../models/registration";
import { useCuisinesViewModel } from "../viewmodels/useCuisinesViewModel";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
// Typing "i" suggests Indian (matches from the start).
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
  const vm = useCuisinesViewModel();
  const ids = Array.isArray(field.value) ? (field.value as string[]) : [];
  const selected = vm.cuisines.filter((cuisine) => ids.includes(cuisine.id));
  return (
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
      onChange={(_, value) => field.onChange(value.map((v) => v.id))}
      onBlur={field.onBlur}
      noOptionsText={vm.error || "No matching cuisine"}
      renderValue={(value, getItemProps) =>
        value.map((option, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return (
            <Chip key={key} size="small" label={option.name} {...itemProps} />
          );
        })
      }
      renderInput={(params) => (
        <CommonTextField
          {...params}
          label={label}
          required
          name={field.name}
          inputRef={field.ref}
          placeholder={selected.length ? "" : "Search cuisines…"}
          error={!!error || !!vm.error}
          helperText={
            error ||
            (vm.error
              ? `Could not load cuisines: ${vm.error}`
              : "Type to search, or pick from the list.")
          }
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
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
  );
}
