"use client";
import { Controller } from "react-hook-form";
import {
  Alert,
  Autocomplete,
  Box,
  CircularProgress,
  FormHelperText,
  Typography,
} from "@mui/material";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { useLocationSearchViewModel } from "../viewmodels/useLocationSearchViewModel";
import { LocationMap } from "./LocationMap";
export function LocationSearch() {
  const vm = useLocationSearchViewModel();
  const pinned = vm.latitude != null && vm.longitude != null;
  return (
    <>
      <Controller
        control={vm.form.control}
        name="address"
        render={({ field, fieldState }) => (
          <Autocomplete
            className="full"
            options={vm.options}
            value={vm.selected}
            loading={vm.loading}
            // Results are already filtered by the location API.
            filterOptions={(options) => options}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) =>
              option.label === value.label
            }
            noOptionsText={
              vm.error || "Type at least 3 characters to search for your area"
            }
            onInputChange={(_, text, reason) => {
              if (reason === "input") vm.search(text);
            }}
            onChange={(_, location) => vm.select(location)}
            onBlur={field.onBlur}
            renderOption={({ key, ...props }, option) => (
              <li
                key={key}
                {...props}
                className={`${props.className} location-option`}
              >
                <PlaceOutlined fontSize="small" color="action" />
                <span>{option.label}</span>
              </li>
            )}
            renderInput={(params) => (
              <CommonTextField
                {...params}
                label="Search restaurant location"
                placeholder="Search by area, street or locality"
                required
                name={field.name}
                inputRef={field.ref}
                inputPrefix={<SearchOutlined fontSize="small" />}
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message ||
                  (pinned
                    ? "Not quite right? Drag the pin on the map below."
                    : "Pick your location to see it on the map.")
                }
                slotProps={{
                  // Keep Autocomplete's own label/input props (they carry the
                  // ref it needs to find and focus the input).
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
        )}
      />
      <Controller
        control={vm.form.control}
        name="latitude"
        render={({ fieldState }) => (
          <Box className="full">
            {pinned ? (
              <>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 1.5,
                  }}
                >
                  <Typography variant="subtitle2">
                    Drag the pin to your restaurant&apos;s entrance
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    aria-live="polite"
                  >
                    {vm.resolving
                      ? "Updating address…"
                      : `${vm.latitude!.toFixed(6)}, ${vm.longitude!.toFixed(6)}`}
                  </Typography>
                </Box>
                <LocationMap
                  latitude={vm.latitude!}
                  longitude={vm.longitude!}
                  onMove={(lat, lng) => void vm.placePin(lat, lng)}
                />
                {vm.pinError && (
                  <Alert severity="warning" sx={{ mt: 1.5 }}>
                    {vm.pinError}
                  </Alert>
                )}
              </>
            ) : (
              fieldState.error && (
                <FormHelperText error>
                  {fieldState.error.message}
                </FormHelperText>
              )
            )}
          </Box>
        )}
      />
    </>
  );
}
