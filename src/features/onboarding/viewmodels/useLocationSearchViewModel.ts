"use client";
import { useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { RegistrationForm } from "../models/registration";
import type { LocationSuggestion } from "../models/location";
import { reverseGeocode, searchLocations } from "../services/locationService";
const DEBOUNCE_MS = 300;
export function useLocationSearchViewModel() {
  const form = useFormContext<RegistrationForm>();
  const [address, city, state, pincode, latitude, longitude] = useWatch({
    control: form.control,
    name: ["address", "city", "state", "pincode", "latitude", "longitude"],
  });
  const [options, setOptions] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const request = useRef<AbortController>(undefined);
  const [resolving, setResolving] = useState(false);
  const [pinError, setPinError] = useState("");
  const lookup = useRef<AbortController>(undefined);
  // The picked location, rebuilt from the form so it survives step changes.
  const selected: LocationSuggestion | null = address
    ? {
        label: address,
        address,
        city,
        state,
        pincode,
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
      }
    : null;
  function search(text: string) {
    clearTimeout(timer.current);
    request.current?.abort();
    if (text.trim().length < 3) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      try {
        setOptions(await searchLocations(text, controller.signal));
        setError("");
      } catch (e) {
        if (controller.signal.aborted) return;
        setOptions([]);
        setError(e instanceof Error ? e.message : "Location search failed.");
      }
      if (!controller.signal.aborted) setLoading(false);
    }, DEBOUNCE_MS);
  }
  const fieldOptions = { shouldDirty: true, shouldValidate: true };
  // Only overwrite the details the lookup actually found; the vendor can
  // fill in anything missing (e.g. a pin code) by hand.
  function fillAddress(location: LocationSuggestion) {
    if (location.address)
      form.setValue("address", location.address, fieldOptions);
    if (location.city) form.setValue("city", location.city, fieldOptions);
    if (location.state) form.setValue("state", location.state, fieldOptions);
    if (location.pincode)
      form.setValue("pincode", location.pincode, fieldOptions);
  }
  function select(location: LocationSuggestion | null) {
    lookup.current?.abort();
    setPinError("");
    form.setValue("address", location?.address ?? "", fieldOptions);
    form.setValue("latitude", location?.latitude ?? null, fieldOptions);
    form.setValue("longitude", location?.longitude ?? null, fieldOptions);
    if (location) fillAddress(location);
  }
  /**
   * The vendor dragged or tapped the pin. These coordinates are what the
   * backend stores, so they are kept exactly; the address fields are then
   * refreshed from the point.
   */
  async function placePin(lat: number, lng: number) {
    form.setValue("latitude", lat, fieldOptions);
    form.setValue("longitude", lng, fieldOptions);
    lookup.current?.abort();
    const controller = new AbortController();
    lookup.current = controller;
    setResolving(true);
    setPinError("");
    try {
      const location = await reverseGeocode(lat, lng, controller.signal);
      if (location) fillAddress(location);
    } catch (e) {
      if (controller.signal.aborted) return;
      setPinError(
        `${e instanceof Error ? e.message : "Address lookup failed."} The pin is saved; fill in the address by hand.`,
      );
    }
    if (!controller.signal.aborted) setResolving(false);
  }
  return {
    form,
    selected,
    options,
    loading,
    error,
    search,
    select,
    latitude,
    longitude,
    placePin,
    resolving,
    pinError,
  };
}
