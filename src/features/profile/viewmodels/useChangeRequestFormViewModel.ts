"use client";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/shared/utils/errors";
import { useRequestProfileChangeMutation } from "../services/restaurantApi";
const GST = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
const AADHAAR = /^\d{12}$/;
const EMPTY = {
  restaurantName: "",
  ownerName: "",
  gst: "",
  gstDocument: null as File | null,
  panNumber: "",
  pan: null as File | null,
  aadhaarNumber: "",
  aadhaar: null as File | null,
};
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
  const gst = values.gst.trim().toUpperCase(),
    pan = values.panNumber.trim().toUpperCase(),
    aadhaar = values.aadhaarNumber.trim();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSent(false);
    const changes = {
      rest_name: values.restaurantName.trim(),
      owner_name: values.ownerName.trim(),
      gst,
      gst_document: values.gstDocument,
      pan_number: pan,
      pan_card: values.pan,
      aadhaar_number: aadhaar,
      adhaar_card: values.aadhaar,
    };
    if (!Object.values(changes).some(Boolean))
      return setError("Fill in at least one field to request a change.");
    if (gst && !GST.test(gst))
      return setError("Enter a valid 15-character GSTIN.");
    if (pan && !PAN.test(pan))
      return setError("Enter a valid PAN (e.g. ABCDE1234F).");
    if (aadhaar && !AADHAAR.test(aadhaar))
      return setError("Enter a valid 12-digit Aadhaar number.");
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
