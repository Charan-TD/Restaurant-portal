import { useState, type ReactNode } from "react";
import { InputAdornment, TextField, type TextFieldProps } from "@mui/material";
export type CommonTextFieldProps = Omit<TextFieldProps, "prefix"> & {
  /**
   * Shown before the input, e.g. "+91" or an icon. It appears only while the
   * field is focused or filled, so the label sits inside the empty field like
   * every other input instead of being pinned to the border.
   */
  inputPrefix?: ReactNode;
};
type SlotObject = Record<string, unknown>;
export function CommonTextField({
  inputPrefix,
  ...props
}: CommonTextFieldProps) {
  const [focused, setFocused] = useState(false);
  if (inputPrefix === undefined)
    return <TextField fullWidth variant="outlined" {...props} />;
  const slots = (props.slotProps ?? {}) as Record<string, SlotObject>,
    // Autocomplete passes the typed text through htmlInput, not `value`.
    value = props.value ?? slots.htmlInput?.value,
    raised = focused || (value != null && String(value) !== "");
  return (
    <TextField
      fullWidth
      variant="outlined"
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      slotProps={{
        ...slots,
        inputLabel: { ...slots.inputLabel, shrink: raised },
        input: {
          ...slots.input,
          startAdornment: raised ? (
            <InputAdornment position="start">{inputPrefix}</InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}
