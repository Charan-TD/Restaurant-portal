"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePortal } from "@/core/providers/PortalProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { errorMessage } from "@/shared/utils/errors";
import {
  getRestaurantDetails,
  updateRestaurantProfile,
  type RestaurantDetails,
} from "../services/restaurantService";
import { profileSchema, type ProfileForm } from "../models/profile";
import { useVendorProfile } from "./useVendorProfile";
export function useProfileViewModel() {
  const portal = usePortal(),
    vendor = useVendorProfile(),
    [editing, setEditing] = useState(false),
    [saved, setSaved] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [details, setDetails] = useState<RestaurantDetails | null>(null),
    [logo, setLogo] = useState<File | null>(null),
    [cover, setCover] = useState<File | null>(null);
  // Bumping the key reloads the profile, e.g. after a save.
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    if (DEMO_MODE) return;
    let active = true;
    getRestaurantDetails()
      .then((data) => active && setDetails(data))
      // The page still shows what the login already told us.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [reloadKey]);
  const loadDetails = () => setReloadKey((key) => key + 1);
  const current = (): ProfileForm => ({
    name: vendor.nameKnown ? vendor.vendorName : "",
    restaurantName: vendor.restaurantName,
    email: vendor.email,
    phone: vendor.phone,
    city: vendor.city,
  });
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: current(),
  });
  const startEditing = () => {
    form.reset(current());
    setLogo(null);
    setCover(null);
    setSaved(false);
    setEditing(true);
  };
  // The phone number, logo and cover save directly; names, documents and the
  // location go through a change request for admin approval.
  const save = form.handleSubmit(async (values) => {
    setError("");
    if (!DEMO_MODE) {
      const phoneChanged = !!values.phone && values.phone !== vendor.phone;
      if (phoneChanged || logo || cover) {
        setBusy(true);
        try {
          await updateRestaurantProfile({
            contact: phoneChanged ? values.phone : undefined,
            logo,
            cover,
          });
          loadDetails();
        } catch (e) {
          setError(errorMessage(e));
          return;
        } finally {
          setBusy(false);
        }
      }
    }
    portal.setProfile((profile) => ({
      ...profile,
      ...(DEMO_MODE && {
        name: values.name.trim(),
        restaurantName: values.restaurantName.trim(),
        email: values.email.trim(),
        city: values.city.trim() || undefined,
      }),
      phone: values.phone ? `${COUNTRY_CODE}${values.phone}` : undefined,
    }));
    setEditing(false);
    setSaved(true);
  });
  return {
    vendor,
    details,
    form,
    editing,
    saved,
    error,
    busy,
    logo,
    setLogo,
    cover,
    setCover,
    reloadDetails: loadDetails,
    startEditing,
    cancel: () => setEditing(false),
    save,
    dismissSaved: () => setSaved(false),
  };
}
export type ProfileViewModel = ReturnType<typeof useProfileViewModel>;
