"use client";
import { useRouter, usePathname } from "next/navigation";
import { Typography, LinearProgress, Divider } from "@mui/material";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutlined";
import { useWatch } from "react-hook-form";
import { usePortal } from "@/core/providers/PortalProvider";
import { steps } from "@/core/constants/onboarding";
export function SetupSidebar() {
  const portal = usePortal(),
    router = useRouter(),
    pathname = usePathname();
  const name = useWatch({
    control: portal.form.control,
    name: "restaurantName",
  });
  return (
    <aside className="setup-aside">
      <Typography variant="h6">
        {name || portal.approval?.restaurantName || "Set up your restaurant"}
      </Typography>
      <div className="progress">
        <strong>
          {portal.completed.length} of {steps.length} steps done
        </strong>
        <LinearProgress
          variant="determinate"
          value={(portal.completed.length / steps.length) * 100}
        />
        <small>Complete your details to submit for approval.</small>
      </div>
      <nav>
        {steps.map(({ id, title }, i) => (
          <button
            type="button"
            key={id}
            className={
              pathname === "/register" && portal.currentStep === i
                ? "step active"
                : "step"
            }
            onClick={() => {
              portal.setCurrentStep(i);
              router.push("/register");
            }}
          >
            <span className="step-number">
              {portal.completed.includes(i) ? (
                <CheckCircleOutline fontSize="small" />
              ) : (
                i + 1
              )}
            </span>
            <span>
              {title}
              <small>
                {portal.completed.includes(i)
                  ? "Completed"
                  : pathname === "/register" && portal.currentStep === i
                    ? "Current step"
                    : "Not completed"}
              </small>
            </span>
          </button>
        ))}
      </nav>
      <Divider />
      <p className="aside-note">
        Your restaurant becomes available to customers after admin approval.
      </p>
    </aside>
  );
}
