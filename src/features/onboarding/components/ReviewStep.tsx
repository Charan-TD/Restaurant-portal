"use client";
import { Controller, useWatch } from "react-hook-form";
import { Typography } from "@mui/material";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { usePortal } from "@/core/providers/PortalProvider";
import { steps, LAST_STEP } from "@/core/constants/onboarding";
import { itemTypes } from "../models/registration";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonCheckbox } from "@/shared/components/form/CommonCheckbox";
export function ReviewStep({ onEdit }: { onEdit: (step: number) => void }) {
  const portal = usePortal(),
    data = useWatch({ control: portal.form.control });
  return (
    <>
      <Typography variant="h6">
        {data.restaurantName || "Your restaurant"}
      </Typography>
      {steps.slice(0, LAST_STEP).map(({ id, title }, i) => (
        <div className="review-row" key={id}>
          <CheckCircleOutline
            color={portal.completed.includes(i) ? "success" : "disabled"}
          />
          <div className="grow">
            <strong>{title}</strong>
            <small>
              {portal.completed.includes(i) ? "Completed" : "Needs attention"}
            </small>
            {id === "details" && (
              <small>
                {[
                  data.ownerName,
                  data.email,
                  data.restaurantType,
                  data.foodServed?.length
                    ? `Serves ${data.foodServed.join(", ").toLowerCase()}`
                    : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            )}
            {id === "location" && (
              <small>
                {data.address} {data.city} {data.pincode}
              </small>
            )}
            {id === "bank" && data.accountNumber && (
              <small>Account ending {data.accountNumber.slice(-4)}</small>
            )}
            {id === "menu" && (
              <small>
                {[
                  `${data.menuItems?.length || 0} menu items`,
                  ...itemTypes.map(
                    (type) =>
                      `${data.menuItems?.filter((m) => m.type === type).length || 0} ${type.toLowerCase()}`,
                  ),
                ].join(" · ")}
              </small>
            )}
          </div>
          <CommonButton startIcon={<EditOutlined />} onClick={() => onEdit(i)}>
            Edit
          </CommonButton>
        </div>
      ))}
      <div style={{ marginTop: 16 }}>
        <Controller
          name="agreement"
          control={portal.form.control}
          render={({ field, fieldState }) => (
            <CommonCheckbox
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
              label="I confirm the details are correct and agree to the Partner Agreement and commission terms."
              errorMessage={fieldState.error?.message}
            />
          )}
        />
      </div>
    </>
  );
}
