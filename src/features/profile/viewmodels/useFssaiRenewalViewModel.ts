"use client";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/shared/utils/errors";
import { useRequestProfileChangeMutation } from "../services/restaurantApi";

const FSSAI = /^\d{14}$/;
// The same limit as registration: the backend takes documents up to 2 MB.
const MAX_BYTES = 2 * 1024 * 1024;
const EMPTY = { file: null as File | null, number: "", expiry: "" };

/** Renewing the FSSAI licence: a new file, number and expiry go to an admin. */
export function useFssaiRenewalViewModel(onSent: () => void) {
  const [requestProfileChange] = useRequestProfileChangeMutation(),
    [values, setValues] = useState(EMPTY),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setValues((old) => ({ ...old, [key]: value }));
  const dirty = !!(values.file || values.number || values.expiry);
  const cancel = () => {
    setValues(EMPTY);
    setError("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSent(false);
    if (!dirty) return setError("Upload the renewed licence or fill in its details.");
    if (values.number && !FSSAI.test(values.number))
      return setError("Enter the 14-digit FSSAI licence number.");
    if (values.file && values.file.size > MAX_BYTES)
      return setError("The licence file must be 2 MB or smaller.");
    if (values.expiry && Date.parse(values.expiry) <= Date.now())
      return setError("The new licence must be valid until a future date.");
    setBusy(true);
    setError("");
    try {
      await requestProfileChange({
        fssai: values.file,
        fssai_number: values.number,
        fssai_expiry_date: values.expiry,
      }).unwrap();
      setValues(EMPTY);
      setSent(true);
      onSent();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return { values, set, dirty, busy, error, sent, submit, cancel };
}
