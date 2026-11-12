"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePortal } from "@/core/providers/PortalProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { errorMessage } from "@/shared/utils/errors";
import {
  useGetRestaurantDetailsQuery,
  useUpdateRestaurantProfileMutation,
} from "../services/restaurantApi";
import {
  lockedProfileSchema,
  profileSchema,
  type ProfileForm,
} from "../models/profile";
import { localDigits, useVendorProfile } from "./useVendorProfile";
export function useProfileViewModel() {
  const portal = usePortal(),
    vendor = useVendorProfile(),
    // The page still shows what the login already told us if this fails.
    { data: details = null, refetch } = useGetRestaurantDetailsQuery(
      undefined,
      { skip: DEMO_MODE },
    ),
    [updateRestaurantProfile] = useUpdateRestaurantProfileMutation(),
    [saved, setSaved] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [logo, setLogo] = useState<File | null>(null),
    [cover, setCover] = useState<File | null>(null);
  // The editable number is the restaurant phone from the profile; the sign-in
  // number the session started with is only a fallback.
  const restaurantPhone = localDigits(details?.contact) || vendor.phone;
  const loadDetails = () => void (DEMO_MODE || refetch());
  const current = (): ProfileForm => ({
    name: vendor.nameKnown ? vendor.vendorName : "",
    restaurantName: vendor.restaurantName,
    phone: restaurantPhone,
    city: vendor.city,
  });
  const form = useForm<ProfileForm>({
    resolver: zodResolver(DEMO_MODE ? profileSchema : lockedProfileSchema),
    defaultValues: current(),
  });
  const resetForm = () => {
    form.reset(current());
    setLogo(null);
    setCover(null);
  };
  // The form is always on screen, so it fills in once the profile has loaded.
  const { vendorName, restaurantName, city, nameKnown } = vendor,
    phone = restaurantPhone;
  useEffect(() => {
    if (!form.formState.isDirty)
      form.reset({
        name: nameKnown ? vendorName : "",
        restaurantName,
        phone,
        city,
      });
  }, [form, phone, vendorName, restaurantName, city, nameKnown]);
  // The phone number, logo and cover save directly; names, documents and the
  // location go through a change request for admin approval.
  const save = form.handleSubmit(async (values) => {
    setError("");
    if (!DEMO_MODE) {
      const phoneChanged = !!values.phone && values.phone !== restaurantPhone;
      if (phoneChanged || logo || cover) {
        setBusy(true);
        try {
          await updateRestaurantProfile({
            contact: phoneChanged ? values.phone : undefined,
            logo,
            cover,
          }).unwrap();
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
        city: values.city.trim() || undefined,
      }),
      phone: values.phone ? `${COUNTRY_CODE}${values.phone}` : undefined,
    }));
    form.reset(values);
    setLogo(null);
    setCover(null);
    setSaved(true);
  });
  return {
    vendor,
    details,
    /** Read straight from the profile, so it shows even if it loads late. */
    email: details?.email || vendor.email,
    form,
    saved,
    error,
    busy,
    logo,
    setLogo,
    cover,
    setCover,
    reloadDetails: loadDetails,
    cancel: resetForm,
    save,
    dismissSaved: () => setSaved(false),
  };
}
export type ProfileViewModel = ReturnType<typeof useProfileViewModel>;
