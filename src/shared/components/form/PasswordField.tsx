"use client";
import { useState } from "react";
import { IconButton, InputAdornment } from "@mui/material";
import Visibility from "@mui/icons-material/VisibilityOutlined";
import VisibilityOff from "@mui/icons-material/VisibilityOffOutlined";
import { PasswordChecklist } from "@/features/onboarding/components/PasswordChecklist";
import { passwordRules } from "@/features/onboarding/models/validation";
import { CommonTextField, type CommonTextFieldProps } from "./CommonTextField";
/**
 * Password input with an eye button to show what was typed. With `showRules`
 * it also lists the password requirements, ticking each as it is met (the
 * same checklist the registration form uses).
 */
export function PasswordField({
  showRules,
  className,
  ...props
}: CommonTextFieldProps & { showRules?: boolean }) {
  const [shown, setShown] = useState(false);
  return (
    <div className={className}>
      <CommonTextField
        {...props}
        type={shown ? "text" : "password"}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={() => setShown((value) => !value)}
                  aria-label={shown ? "Hide password" : "Show password"}
                >
                  {shown ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      {showRules && (
        <PasswordChecklist
          value={String(props.value ?? "")}
          rules={passwordRules}
        />
      )}
    </div>
  );
}
