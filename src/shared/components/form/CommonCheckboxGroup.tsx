import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
} from "@mui/material";
export interface CommonCheckboxGroupProps {
  label: string;
  name: string;
  /** Selected options; any number of them can be checked. */
  value: string[];
  options: readonly string[];
  onChange: (value: string[]) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  className?: string;
}
export function CommonCheckboxGroup({
  label,
  name,
  value,
  options,
  onChange,
  onBlur,
  required,
  error,
  helperText,
  className,
}: CommonCheckboxGroupProps) {
  const toggle = (option: string, checked: boolean) =>
    // Keep the options' order whatever order they were ticked in.
    onChange(
      options.filter((o) => (o === option ? checked : value.includes(o))),
    );
  return (
    <FormControl
      component="fieldset"
      error={error}
      required={required}
      className={className}
    >
      <FormLabel component="legend">{label}</FormLabel>
      <FormGroup row onBlur={onBlur}>
        {options.map((option) => (
          <FormControlLabel
            key={option}
            label={option}
            control={
              <Checkbox
                name={name}
                checked={value.includes(option)}
                onChange={(e) => toggle(option, e.target.checked)}
              />
            }
          />
        ))}
      </FormGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
