import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
export interface CommonRadioGroupProps {
  label: string;
  name: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  className?: string;
}
export function CommonRadioGroup({
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
}: CommonRadioGroupProps) {
  return (
    <FormControl error={error} required={required} className={className}>
      <FormLabel id={`${name}-label`}>{label}</FormLabel>
      <RadioGroup
        row
        name={name}
        aria-labelledby={`${name}-label`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      >
        {options.map((option) => (
          <FormControlLabel
            key={option}
            value={option}
            control={<Radio />}
            label={option}
          />
        ))}
      </RadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}
