import {
  Checkbox,
  FormControlLabel,
  FormHelperText,
  type CheckboxProps,
} from "@mui/material";
import type { ReactNode } from "react";
export interface CommonCheckboxProps extends CheckboxProps {
  label: ReactNode;
  errorMessage?: string;
}
export function CommonCheckbox({
  label,
  errorMessage,
  ...props
}: CommonCheckboxProps) {
  return (
    <div>
      <FormControlLabel control={<Checkbox {...props} />} label={label} />
      {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
    </div>
  );
}
