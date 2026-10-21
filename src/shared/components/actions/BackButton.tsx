"use client";

import { usePathname, useRouter } from "next/navigation";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import { CommonButton, type CommonButtonProps } from "./CommonButton";

/** Entry screens: there is nowhere sensible to go back to from these. */
const rootPaths = ["/", "/login", "/dashboard"];

interface Props extends Omit<CommonButtonProps, "onClick" | "children"> {
  /** Where to go when there is no earlier page in this tab's history. */
  fallbackHref?: string;
}

/** Goes back to the previous screen; hidden on the entry screens. */
export function BackButton({ fallbackHref = "/dashboard", sx, ...props }: Props) {
  const router = useRouter(),
    pathname = usePathname();
  if (rootPaths.includes(pathname)) return null;
  return (
    <CommonButton
      color="inherit"
      startIcon={<ArrowBackRounded />}
      onClick={() =>
        window.history.length > 1 ? router.back() : router.push(fallbackHref)
      }
      sx={{ mb: 2, ml: -1, textTransform: "none", fontWeight: 600, ...sx }}
      {...props}
    >
      Back
    </CommonButton>
  );
}
