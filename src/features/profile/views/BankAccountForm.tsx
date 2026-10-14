"use client";
import { useState, type FormEvent } from "react";
import { Alert, Box, Typography } from "@mui/material";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { UploadLink } from "@/shared/components/form/UploadLink";
import { errorMessage } from "@/shared/utils/errors";
import { replaceBankAccount } from "../services/restaurantService";
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const EMPTY = { holder: "", account: "", confirm: "", ifsc: "", bank: "" };
/** Replaces the whole bank account; every detail and a proof are needed. */
export function BankAccountForm({ onSaved }: { onSaved: () => void }) {
  const [values, setValues] = useState(EMPTY),
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
    if (!IFSC.test(ifsc)) return setError("Enter a valid IFSC (e.g. HDFC0001234).");
    if (!proof) return setError("Upload a bank proof, such as a cancelled cheque.");
    setBusy(true);
    setError("");
    try {
      await replaceBankAccount({
        holder: values.holder.trim(),
        account: values.account,
        ifsc,
        bank: values.bank.trim(),
        proof,
      });
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
  return (
    <form noValidate onSubmit={submit}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Saving replaces your whole bank account, so fill in every detail.
      </Typography>
      {done && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Bank account updated.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <div className="form-grid compact-grid">
        <CommonTextField
          label="Account holder name"
          value={values.holder}
          onChange={(e) => set("holder", e.target.value)}
        />
        <CommonTextField
          label="Bank name"
          value={values.bank}
          onChange={(e) => set("bank", e.target.value)}
        />
        <CommonTextField
          label="Account number"
          value={values.account}
          onChange={(e) =>
            set("account", e.target.value.replace(/\D/g, "").slice(0, 18))
          }
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
        />
        <CommonTextField
          label="Confirm account number"
          value={values.confirm}
          onChange={(e) =>
            set("confirm", e.target.value.replace(/\D/g, "").slice(0, 18))
          }
          slotProps={{ htmlInput: { inputMode: "numeric" } }}
        />
        <CommonTextField
          label="IFSC code"
          value={values.ifsc}
          onChange={(e) =>
            set("ifsc", e.target.value.toUpperCase().slice(0, 11))
          }
        />
        <UploadLink label="Bank proof" value={proof} onChange={setProof} />
      </div>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <CommonButton type="submit" variant="contained" disabled={busy}>
          {busy ? "Saving…" : "Save bank details"}
        </CommonButton>
      </Box>
    </form>
  );
}
