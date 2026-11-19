"use client";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/shared/utils/errors";
import {
  useRequestProfileChangeMutation,
  type ProfileChangeInput,
} from "../services/restaurantApi";

export type DocKey = "fssai" | "pan" | "gst" | "aadhaar" | "businessProof";
export interface DocValues {
  file: File | null;
  number: string;
  expiry: string;
}

/** How each document's number is shaped, and the request fields it goes in. */
export const DOC_RULES: Record<
  DocKey,
  {
    title: string;
    numberLabel: string;
    placeholder: string;
    pattern: RegExp;
    invalid: string;
    maxLength: number;
    numeric?: boolean;
    upper?: boolean;
  }
> = {
  fssai: {
    title: "FSSAI licence",
    numberLabel: "licence number",
    placeholder: "14-digit number",
    pattern: /^\d{14}$/,
    invalid: "Enter the 14-digit FSSAI licence number.",
    maxLength: 14,
    numeric: true,
  },
  pan: {
    title: "PAN card",
    numberLabel: "PAN number",
    placeholder: "e.g. ABCDE1234F",
    pattern: /^[A-Z]{5}\d{4}[A-Z]$/,
    invalid: "Enter a valid PAN (e.g. ABCDE1234F).",
    maxLength: 10,
    upper: true,
  },
  gst: {
    title: "GST certificate",
    numberLabel: "GSTIN",
    placeholder: "15-character GSTIN",
    pattern: /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
    invalid: "Enter a valid 15-character GSTIN.",
    maxLength: 15,
    upper: true,
  },
  aadhaar: {
    title: "Identity proof",
    numberLabel: "Aadhaar number",
    placeholder: "12-digit number",
    pattern: /^\d{12}$/,
    invalid: "Enter a valid 12-digit Aadhaar number.",
    maxLength: 12,
    numeric: true,
  },
  businessProof: {
    title: "Business proof",
    numberLabel: "document number",
    placeholder: "Document number",
    pattern: /^.{3,40}$/,
    invalid: "Enter the business proof document number.",
    maxLength: 40,
  },
};

// The same limit as registration: the backend takes documents up to 2 MB.
const MAX_BYTES = 2 * 1024 * 1024;
const EMPTY: DocValues = { file: null, number: "", expiry: "" };
const ALL: Record<DocKey, DocValues> = {
  fssai: EMPTY,
  pan: EMPTY,
  gst: EMPTY,
  aadhaar: EMPTY,
  businessProof: EMPTY,
};
const isDirty = (v: DocValues) => !!(v.file || v.number || v.expiry);

/** Renewing or replacing any business document: all changes go to an admin together. */
export function useDocumentsViewModel(onSent: () => void) {
  const [requestProfileChange] = useRequestProfileChangeMutation(),
    [values, setValues] = useState(ALL),
    [selected, setSelected] = useState<DocKey | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const set = <K extends keyof DocValues>(
    doc: DocKey,
    key: K,
    value: DocValues[K],
  ) =>
    setValues((old) => ({ ...old, [doc]: { ...old[doc], [key]: value } }));
  const dirty = (Object.keys(values) as DocKey[]).some((k) =>
    isDirty(values[k]),
  );
  const cancel = () => {
    setValues(ALL);
    setSelected(null);
    setError("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSent(false);
    if (!dirty) return setError("Upload a document or fill in its details.");
    const changes: ProfileChangeInput = {};
    for (const doc of Object.keys(values) as DocKey[]) {
      const v = values[doc],
        rule = DOC_RULES[doc],
        number = rule.upper ? v.number.trim().toUpperCase() : v.number.trim();
      if (!isDirty(v)) continue;
      if (number && !rule.pattern.test(number)) return setError(rule.invalid);
      if (v.file && v.file.size > MAX_BYTES)
        return setError(`The ${rule.title} file must be 2 MB or smaller.`);
      if (doc === "fssai") {
        if (v.expiry && Date.parse(v.expiry) <= Date.now())
          return setError("The new licence must be valid until a future date.");
        changes.fssai = v.file;
        changes.fssai_number = number;
        changes.fssai_expiry_date = v.expiry;
      } else if (doc === "pan") {
        changes.pan_card = v.file;
        changes.pan_number = number;
      } else if (doc === "gst") {
        changes.gst_document = v.file;
        changes.gst = number;
      } else if (doc === "aadhaar") {
        changes.adhaar_card = v.file;
        changes.aadhaar_number = number;
      } else {
        changes.business_proof = v.file;
        changes.business_proof_number = number;
      }
    }
    setBusy(true);
    setError("");
    try {
      await requestProfileChange(changes).unwrap();
      setValues(ALL);
      setSelected(null);
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
    set,
    selected,
    select: (doc: DocKey) => setSelected((cur) => (cur === doc ? null : doc)),
    dirty,
    busy,
    error,
    sent,
    submit,
    cancel,
  };
}
