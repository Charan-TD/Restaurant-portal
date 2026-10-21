"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { Box, Typography } from "@mui/material";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { DocumentUpload } from "@/shared/components/form/DocumentUpload";
import { useBankAccountViewModel } from "../viewmodels/useBankAccountViewModel";
/** Replaces the whole bank account; every detail and a proof are needed. */
export function BankAccountForm({
  onSaved,
  proofUrl,
}: {
  onSaved: () => void;
  /** The bank proof already on record, if any. */
  proofUrl?: string;
}) {
  const { values, proof, setProof, busy, error, done, set, submit } =
    useBankAccountViewModel(onSaved);
  return (
    <form noValidate onSubmit={submit}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Saving replaces your whole bank account, so fill in every detail.
      </Typography>
      {done && (
        <ToastAlert severity="success" sx={{ mb: 2 }}>
          Bank account updated.
        </ToastAlert>
      )}
      {error && (
        <ToastAlert severity="error" sx={{ mb: 2 }}>
          {error}
        </ToastAlert>
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
        <Box className="full">
          <DocumentUpload
            required
            title="Bank proof"
            hint="Cancelled cheque or passbook page"
            value={proof}
            onChange={setProof}
            currentUrl={proofUrl}
          />
        </Box>
      </div>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
        <CommonButton type="submit" variant="contained" disabled={busy}>
          {busy ? "Saving…" : "Save bank details"}
        </CommonButton>
      </Box>
    </form>
  );
}
