"use client";
import { useRef, useState, type FormEvent } from "react";
import {
  reverseGeocode,
  searchLocations,
} from "@/features/onboarding/services/locationService";
import type { LocationSuggestion } from "@/features/onboarding/models/location";
import { errorMessage } from "@/shared/utils/errors";
import { requestProfileChange } from "../services/restaurantService";
const EMPTY = { building: "", landmark: "", city: "", state: "", pincode: "" };
export function useLocationRequestViewModel(onSent: () => void) {
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
    setPin(
      location ? { lat: location.latitude, lon: location.longitude } : null,
    );
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
  return {
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
  };
}
