"use client";
import { useRef } from "react";
import { Box } from "@mui/material";

/** One box per digit: typing moves on, Backspace moves back, and a pasted code fills all. */
export function OtpInput({
  value,
  onChange,
  length,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  length: number;
  disabled?: boolean;
}) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]),
    focus = (i: number) => boxes.current[Math.min(Math.max(i, 0), length - 1)]?.focus();
  const setDigit = (i: number, digit: string) => {
    const digits = value.padEnd(length, " ").split("");
    digits[i] = digit || " ";
    onChange(digits.join("").trimEnd().replace(/ /g, ""));
  };
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      {Array.from({ length }, (_, i) => (
        <Box
          key={i}
          component="input"
          ref={(el: HTMLInputElement | null) => {
            boxes.current[i] = el;
          }}
          aria-label={`OTP digit ${i + 1}`}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const digit = e.target.value.replace(/\D/g, "").slice(-1);
            setDigit(i, digit);
            if (digit) focus(i + 1);
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Backspace" && !value[i]) focus(i - 1);
            if (e.key === "ArrowLeft") focus(i - 1);
            if (e.key === "ArrowRight") focus(i + 1);
          }}
          onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
            const pasted = e.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, length);
            if (!pasted) return;
            e.preventDefault();
            onChange(pasted);
            focus(pasted.length);
          }}
          sx={{
            width: 48,
            height: 52,
            boxSizing: "border-box",
            border: "1.5px solid #e6e6e6",
            borderRadius: "12px",
            bgcolor: "#fff",
            textAlign: "center",
            fontSize: 20,
            fontWeight: 600,
            color: "#1c1c1c",
            outline: 0,
            fontFamily: "inherit",
            "&:focus": { border: "2px solid #ee5b00" },
            "&:disabled": { bgcolor: "#f7f8fa" },
          }}
        />
      ))}
    </Box>
  );
}
