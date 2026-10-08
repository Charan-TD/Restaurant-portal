"use client";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import type { ReactNode } from "react";
import { CommonButton } from "../actions/CommonButton";
export interface CommonDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}
export function CommonDialog({
  open,
  title,
  onClose,
  children,
}: CommonDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <CommonButton onClick={onClose}>Close</CommonButton>
      </DialogActions>
    </Dialog>
  );
}
