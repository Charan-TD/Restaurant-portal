import { MenuItem, type TextFieldProps } from "@mui/material";
import { CommonTextField } from "./CommonTextField";
export type CommonSelectProps = Omit<TextFieldProps, "select" | "children"> & {
  options: readonly string[];
};
export function CommonSelect({ options, ...props }: CommonSelectProps) {
  return (
    <CommonTextField select {...props}>
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </CommonTextField>
  );
}
