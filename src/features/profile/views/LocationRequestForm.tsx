"use client";
import { useRef, useState, type FormEvent } from "react";
import { Alert, Autocomplete, Box, Typography } from "@mui/material";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import {
  reverseGeocode,
  searchLocations,
} from "@/features/onboarding/services/locationService";
import { LocationMap } from "@/features/onboarding/components/LocationMap";
import type { LocationSuggestion } from "@/features/onboarding/models/location";
import { errorMessage } from "@/shared/utils/errors";
import { requestProfileChange } from "../services/restaurantService";
const EMPTY = { building: "", landmark: "", city: "", state: "", pincode: "" };
/** Ask admin to move the restaurant: search the new area, then add details. */
export function LocationRequestForm({ onSent }: { onSent: () => void }) {
  const [values, setValues] = useState(EMPTY),
    [picked, setPicked] = useState<LocationSuggestion | null>(null),
    [options, setOptions] = useState<LocationSuggestion[]>([]),
    // The exact spot: starts at the search result and moves with the pin.
    [pin, setPin] = useState<{ lat: number; lon: number } | null>(null),
    [resolving, setResolving] = useState(false),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false),
    timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const set = (key: keyof typeof EMPTY, value: string) =>
    setValues((old) => ({ ...old, [key]: value }));
  function search(text: string) {
    clearTimeout(timer.current);
    if (text.trim().length < 3) return setOptions([]);
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        setOptions(await searchLocations(text));
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }
  /** The vendor moved the pin: keep its exact spot and refresh the address. */
  async function movePin(lat: number, lon: number) {
    setPin({ lat, lon });
    setResolving(true);
    try {
      const found = await reverseGeocode(lat, lon);
      if (found)
        setValues((old) => ({
          ...old,
          city: found.city || old.city,
          state: found.state || old.state,
          pincode: found.pincode || old.pincode,
        }));
    } catch {
      // The pin is still saved; the address can be typed by hand.
    } finally {
      setResolving(false);
    }
  }
  function choose(location: LocationSuggestion | null) {
    setPicked(location);
    setPin(location ? { lat: location.latitude, lon: location.longitude } : null);
    if (location)
      setValues((old) => ({
        ...old,
        city: location.city,
        state: location.state,
        pincode: location.pincode,
      }));
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSent(false);
    if (!picked) return setError("Search and pick the new location first.");
    if (!values.building.trim())
      return setError("Enter the shop number or building name.");
    if (!/^\d{6}$/.test(values.pincode.trim()))
      return setError("Enter a valid 6-digit pincode.");
    setBusy(true);
    setError("");
    try {
      await requestProfileChange({
        house_no: values.building.trim(),
        landmark: values.landmark.trim(),
        city: values.city.trim(),
        state: values.state.trim(),
        pincode: values.pincode.trim(),
        lat: pin?.lat ?? picked.latitude,
        lon: pin?.lon ?? picked.longitude,
      });
      setValues(EMPTY);
      setPicked(null);
      setPin(null);
      setSent(true);
      onSent();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form noValidate onSubmit={submit}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        A new location needs admin approval. Your current location stays until
        it is approved.
      </Typography>
      {sent && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Request sent. An admin will review the new location.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
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
