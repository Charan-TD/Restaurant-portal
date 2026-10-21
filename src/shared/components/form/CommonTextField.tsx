import { useEffect, useRef, useState, type ReactNode } from "react";
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
/**
 * True once the browser has autofilled the field (a saved login, say). Chrome
 * can fill it before the page has loaded, so React is never told and the label
 * would stay on top of the filled-in text; the field is checked after load.
 */
function useAutofilled() {
  const ref = useRef<HTMLDivElement>(null),
    [autofilled, setAutofilled] = useState(false);
  useEffect(() => {
    const check = () => {
      const input =
        ref.current?.querySelector<HTMLInputElement>("input, textarea");
      if (!input) return;
      let filled = !!input.value;
      try {
        filled = filled || input.matches(":-webkit-autofill");
      } catch {
        // Browsers without the pseudo-class: the value check is enough.
      }
      if (filled) setAutofilled(true);
    };
    // The browser fills the saved values a moment after load.
    const timers = [0, 150, 500, 1200, 2500].map((ms) => setTimeout(check, ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  return [ref, autofilled] as const;
}
export function CommonTextField({
  inputPrefix,
  ...props
}: CommonTextFieldProps) {
  const [focused, setFocused] = useState(false),
    [rootRef, autofilled] = useAutofilled();
  const slots = (props.slotProps ?? {}) as Record<string, SlotObject>,
    // Keeps the label above an autofilled value; an explicit shrink wins.
    labelSlot =
      autofilled && slots.inputLabel?.shrink === undefined
        ? { ...slots.inputLabel, shrink: true }
        : slots.inputLabel;
  if (inputPrefix === undefined)
    return (
      <TextField
        fullWidth
        variant="outlined"
        {...props}
        ref={rootRef}
        slotProps={{ ...slots, inputLabel: labelSlot }}
      />
    );
  const // Autocomplete passes the typed text through htmlInput, not `value`.
    value = props.value ?? slots.htmlInput?.value,
    raised = focused || autofilled || (value != null && String(value) !== "");
  return (
    <TextField
      fullWidth
      variant="outlined"
      {...props}
      ref={rootRef}
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
