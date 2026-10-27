"use client";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/shared/utils/errors";
import { useReplaceBankAccountMutation } from "../services/restaurantApi";
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMPTY = { holder: "", account: "", confirm: "", ifsc: "", bank: "" };
export function useBankAccountViewModel(onSaved: () => void) {
  const [replaceBankAccount] = useReplaceBankAccountMutation(),
    [values, setValues] = useState(EMPTY),
    [proof, setProof] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState(false);
  const set = (key: keyof typeof EMPTY, value: string) =>
    setValues((old) => ({ ...old, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setDone(false);
    const ifsc = values.ifsc.trim().toUpperCase();
    if (!values.holder.trim() || !values.bank.trim())
      return setError("Enter the account holder and bank name.");
    if (!/^\d{9,18}$/.test(values.account))
      return setError("Enter a valid account number (9 to 18 digits).");
    if (values.account !== values.confirm)
      return setError("Account numbers do not match.");
    if (!IFSC.test(ifsc))
      return setError("Enter a valid IFSC (e.g. HDFC0001234).");
    if (!proof)
      return setError("Upload a bank proof, such as a cancelled cheque.");
    setBusy(true);
    setError("");
    try {
      await replaceBankAccount({
        holder: values.holder.trim(),
        account: values.account,
        ifsc,
        bank: values.bank.trim(),
        proof,
      }).unwrap();
      setValues(EMPTY);
      setProof(null);
      setDone(true);
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return { values, proof, setProof, busy, error, done, set, submit };
}
