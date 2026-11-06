"use client";
import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { searchFieldSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField } from "@/shared/components/form/FormField";
import { LocationMap } from "@/features/onboarding/components/LocationMap";
import { DEMO_MODE } from "@/core/constants/config";
import type { RestaurantDetails } from "../services/restaurantApi";
import { useLocationRequestViewModel } from "../viewmodels/useLocationRequestViewModel";
import { PaneFooter, ReadField, SubHeading } from "./PaneParts";
import { PaneHeading } from "./PaneHeading";

const noop = () => undefined;

/**
 * The saved address and pin. Searching for a new place is how a change starts:
 * once one is picked the pin and address become editable and can be sent to an
 * admin for approval; until then everything is shown only.
 */
export function LocationPane({
  details,
  onSent,
}: {
  details?: RestaurantDetails | null;
  onSent: () => void;
}) {
  const vm = useLocationRequestViewModel(onSent),
    place = details?.location,
    changing = !!vm.picked && !!vm.pin,
    pin =
      vm.pin ??
      (place?.latitude != null && place?.longitude != null
        ? { lat: place.latitude, lon: place.longitude }
        : null),
    field = (
      label: string,
      key: "building" | "landmark" | "city" | "state" | "pincode",
      saved?: string,
    ) =>
      changing ? (
        <FormField label={label}>
          <CommonTextField
            value={vm.values[key]}
            onChange={(e) =>
              vm.set(
                key,
                key === "pincode"
                  ? e.target.value.replace(/\D/g, "").slice(0, 6)
                  : e.target.value,
              )
            }
            slotProps={{
              htmlInput: {
                "aria-label": label,
                inputMode: key === "pincode" ? "numeric" : undefined,
              },
            }}
          />
        </FormField>
      ) : (
        <ReadField label={label} value={saved} />
      );
  return (
    <form noValidate onSubmit={vm.submit}>
      <PaneHeading
        title="Restaurant location"
        subtitle="Where riders pick up your orders"
      />
      <Box sx={{ p: 3, display: "grid", gap: 2.5 }}>
        {vm.sent && (
          <ToastAlert severity="success">
            Request sent. An admin will review the new location.
          </ToastAlert>
        )}
        {vm.error && <ToastAlert severity="error">{vm.error}</ToastAlert>}
        <SubHeading>Restaurant address</SubHeading>
        {!DEMO_MODE && (
          <Autocomplete
            options={vm.options}
            value={vm.picked}
            loading={vm.loading}
            filterOptions={(all) => all}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(a, b) => a.label === b.label}
            noOptionsText="Type at least 3 characters to search for the area"
            onInputChange={(_, text, reason) => {
              if (reason === "input") vm.search(text);
            }}
            onChange={(_, location) => vm.choose(location)}
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
              <TextField
                {...params}
                fullWidth
                sx={searchFieldSx}
                placeholder="Search a new area, street or locality to request a change"
                slotProps={{
                  ...params.slotProps,
                  htmlInput: {
                    ...params.slotProps.htmlInput,
                    "aria-label": "Search a new location",
                  },
                  input: {
                    ...params.slotProps.input,
                    startAdornment: (
                      <SearchOutlined
                        className="search-icon"
                        sx={{ fontSize: 20, mr: 1 }}
                      />
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
        )}
        <Box
          sx={{
            overflow: "hidden",
            borderRadius: tokens.radius.input,
            bgcolor: tokens.color.sunken,
            border: `1px solid ${tokens.color.border}`,
          }}
        >
          {pin ? (
            <Box sx={{ pointerEvents: changing ? "auto" : "none" }}>
              <LocationMap
                readOnly={!changing}
                height={220}
                latitude={pin.lat}
                longitude={pin.lon}
                onMove={changing ? (lat, lon) => void vm.movePin(lat, lon) : noop}
              />
            </Box>
          ) : (
            <Box
              sx={{
                height: 140,
                display: "grid",
                placeItems: "center",
                color: tokens.color.textMuted,
              }}
            >
              No map pin saved yet
            </Box>
          )}
        </Box>
        {changing && (
          <Typography
            aria-live="polite"
            sx={{ fontSize: 13, color: tokens.color.textMuted }}
          >
            {vm.resolving
              ? "Updating address…"
              : "Drag the pin to your restaurant’s entrance, then add the shop details."}
          </Typography>
        )}
        {field("Shop no. and building", "building", place?.building)}
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              md: `repeat(${changing ? 4 : 3}, minmax(0, 1fr))`,
            },
          }}
        >
          {field("Landmark", "landmark", place?.landmark)}
          {field("City", "city", place?.city)}
          {changing && field("State", "state", place?.state)}
          {field("PIN code", "pincode", place?.pincode)}
        </Box>
        {!DEMO_MODE && (
          <Typography sx={{ fontSize: 13, color: tokens.color.textSubtle }}>
            Search for the new place to ask for a change. It needs admin
            approval, and your current location stays until it is approved.
          </Typography>
        )}
      </Box>
      {changing && (
        <PaneFooter>
          <CommonButton variant="text" onClick={vm.cancel} disabled={vm.busy}>
            Cancel
          </CommonButton>
          <CommonButton type="submit" variant="contained" disabled={vm.busy}>
            {vm.busy ? "Sending…" : "Request approval"}
          </CommonButton>
        </PaneFooter>
      )}
    </form>
  );
}
