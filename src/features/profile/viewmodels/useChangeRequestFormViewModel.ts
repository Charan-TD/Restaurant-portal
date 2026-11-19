"use client";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/shared/utils/errors";
import { useRequestProfileChangeMutation } from "../services/restaurantApi";
const EMPTY = { restaurantName: "", ownerName: "" };
/** A restaurant or owner name change, sent to an admin for approval. */
export function useChangeRequestFormViewModel(onSent: () => void) {
  const [requestProfileChange] = useRequestProfileChangeMutation(),
    [values, setValues] = useState(EMPTY),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const set = <K extends keyof typeof EMPTY>(
    key: K,
    value: (typeof EMPTY)[K],
  ) => setValues((old) => ({ ...old, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSent(false);
    const changes = {
      rest_name: values.restaurantName.trim(),
      owner_name: values.ownerName.trim(),
    };
    if (!Object.values(changes).some(Boolean))
      return setError("Fill in at least one field to request a change.");
    setBusy(true);
    setError("");
    try {
      await requestProfileChange(changes).unwrap();
      setValues(EMPTY);
      setSent(true);
      onSent();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return { values, set, busy, error, sent, submit };
}
