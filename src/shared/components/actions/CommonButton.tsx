import { Button, type ButtonProps } from "@mui/material";
export type CommonButtonProps = ButtonProps;
export function CommonButton({ type = "button", ...props }: CommonButtonProps) {
  return <Button type={type} {...props} />;
}
