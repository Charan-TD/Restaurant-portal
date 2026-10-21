"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { Autocomplete, Box, Typography } from "@mui/material";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { LocationMap } from "@/features/onboarding/components/LocationMap";
import { useLocationRequestViewModel } from "../viewmodels/useLocationRequestViewModel";
/** Ask admin to move the restaurant: search the new area, then add details. */
export function LocationRequestForm({ onSent }: { onSent: () => void }) {
  const {
    values,
    picked,
    options,
    pin,
    resolving,
    loading,
    busy,
    error,
    sent,
    set,
    search,
    movePin,
    choose,
    submit,
  } = useLocationRequestViewModel(onSent);
  return (
    <form noValidate onSubmit={submit}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        A new location needs admin approval. Your current location stays until
        it is approved.
      </Typography>
      {sent && (
        <ToastAlert severity="success" sx={{ mb: 2 }}>
          Request sent. An admin will review the new location.
        </ToastAlert>
      )}
      {error && (
        <ToastAlert severity="error" sx={{ mb: 2 }}>
          {error}
        </ToastAlert>
      )}
      <div className="form-grid compact-grid">
        <Autocomplete
          className="full"
          options={options}
          value={picked}
          loading={loading}
          filterOptions={(all) => all}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(a, b) => a.label === b.label}
          noOptionsText="Type at least 3 characters to search for the area"
          onInputChange={(_, text, reason) => {
            if (reason === "input") search(text);
          }}
          onChange={(_, location) => choose(location)}
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
              label="Search new location"
              placeholder="Search by area, street or locality"
            />
          )}
        />
        {pin && (
          <Box className="full">
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
                {resolving
                  ? "Updating address…"
                  : `${pin.lat.toFixed(6)}, ${pin.lon.toFixed(6)}`}
              </Typography>
            </Box>
            <LocationMap
              latitude={pin.lat}
              longitude={pin.lon}
              onMove={(lat, lon) => void movePin(lat, lon)}
            />
          </Box>
        )}
        <CommonTextField
          label="Shop no. / Building / Floor"
          value={values.building}
          onChange={(e) => set("building", e.target.value)}
        />
        <CommonTextField
          label="Landmark"
          value={values.landmark}
          onChange={(e) => set("landmark", e.target.value)}
        />
        <CommonTextField
          label="City"
          value={values.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <CommonTextField
          label="State"
          value={values.state}
          onChange={(e) => set("state", e.target.value)}
        />
        <CommonTextField
          label="Pincode"
          value={values.pincode}
          onChange={(e) =>
            set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
        />
      </div>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <CommonButton type="submit" variant="contained" disabled={busy}>
          {busy ? "Sending…" : "Request approval"}
        </CommonButton>
      </Box>
    </form>
  );
}
