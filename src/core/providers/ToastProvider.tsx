"use client";
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  Snackbar,
  type AlertColor,
  type AlertProps,
} from "@mui/material";

interface Toast {
  id: number;
  message: ReactNode;
  severity: AlertColor;
}
interface Toaster {
  success: (message: ReactNode) => void;
  error: (message: ReactNode) => void;
  info: (message: ReactNode) => void;
}
const ToastContext = createContext<Toaster | null>(null);

/**
 * Flash messages shown over the page, so the vendor sees the result of an
 * action wherever they are scrolled to. Errors stay a little longer.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null),
    [open, setOpen] = useState(false);
  const show = useCallback((severity: AlertColor, message: ReactNode) => {
    setToast({ id: Date.now(), severity, message });
    setOpen(true);
  }, []);
  const toaster = useMemo<Toaster>(
    () => ({
      success: (message) => show("success", message),
      error: (message) => show("error", message),
      info: (message) => show("info", message),
    }),
    [show],
  );
  return (
    <ToastContext.Provider value={toaster}>
      {children}
      <Snackbar
        key={toast?.id}
        open={open}
        autoHideDuration={toast?.severity === "error" ? 8000 : 4500}
        onClose={(_, reason) => reason !== "clickaway" && setOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ top: { xs: 12, sm: 24 } }}
      >
        <Alert
          severity={toast?.severity}
          variant="filled"
          onClose={() => setOpen(false)}
          sx={{
            width: "100%",
            maxWidth: 520,
            alignItems: "center",
            fontWeight: 600,
            boxShadow: "0 8px 28px rgba(16, 24, 40, 0.25)",
          }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): Toaster {
  const context = useContext(ToastContext);
  if (!context) throw new Error("ToastProvider is required.");
  return context;
}

/** Plain text of a message, used to show a repeated alert only when it changes. */
function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) =>
      isValidElement<{ children?: ReactNode }>(child)
        ? textOf(child.props.children)
        : String(child),
    )
    .join("");
}

/**
 * Drop-in for an inline <Alert>: instead of sitting in the page, its message
 * pops up as a flash message when it appears. Other Alert props are ignored.
 */
export function ToastAlert({
  severity = "info",
  children,
}: Pick<AlertProps, "severity" | "children" | "onClose" | "sx" | "action">) {
  const toast = useToast(),
    text = textOf(children);
  useEffect(() => {
    toast[severity === "success" || severity === "error" ? severity : "info"](
      children,
    );
    // Shown when it appears or its wording changes, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severity, text, toast]);
  return null;
}
