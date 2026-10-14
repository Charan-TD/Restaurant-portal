"use client";
import type { ReactNode } from "react";
import { Controller } from "react-hook-form";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import NextLink from "next/link";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { DocumentUpload } from "@/shared/components/form/DocumentUpload";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { DEMO_MODE } from "@/core/constants/config";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import type { ProfileForm } from "../models/profile";
import type { ProfileViewModel } from "../viewmodels/useProfileViewModel";
import { useChangeRequests } from "../viewmodels/useChangeRequests";
import { BankAccountForm } from "./BankAccountForm";
import { ChangeRequestForm, ChangeRequestHistory } from "./ChangeRequestCard";
import { LocationRequestForm } from "./LocationRequestForm";
import { ProfileSection } from "./ProfileSection";
const fields: { name: keyof ProfileForm; label: string; type?: string }[] = [
  { name: "restaurantName", label: "Restaurant name" },
  { name: "name", label: "Owner name" },
  { name: "phone", label: "Mobile number", type: "tel" },
  { name: "email", label: "Email", type: "email" },
  { name: "city", label: "City" },
];
/** A collapsible section of the edit page, closed until the vendor needs it. */
function EditAccordion({
  icon,
  title,
  hint,
  children,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: "16px !important",
        overflow: "hidden",
        "&::before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{ px: 3, minHeight: 68, "& .MuiAccordionSummary-content": { my: 1.5 } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(242,106,46,.1)",
              color: "primary.main",
            }}
          >
            {icon}
          </Box>
          <div>
            <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          </div>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 3, pb: 3, pt: 1 }}>{children}</AccordionDetails>
    </Accordion>
  );
}
/** The edit page: direct changes first, then the sections that need approval. */
export function EditProfileView({ vm }: { vm: ProfileViewModel }) {
  const changes = useChangeRequests();
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <ProfileSection
        icon={<StorefrontOutlined fontSize="small" />}
        title="Restaurant details"
      >
        <form noValidate onSubmit={vm.save}>
          <div className="form-grid compact-grid">
            {fields.map((item) => (
              <Controller
                key={item.name}
                name={item.name}
                control={vm.form.control}
                render={({ field, fieldState }) => (
                  <CommonTextField
                    {...field}
                    type={item.type}
                    label={item.label}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    disabled={!DEMO_MODE && item.name !== "phone"}
                    {...(item.name === "phone" && {
                      inputPrefix: COUNTRY_CODE,
                      onChange: (e) =>
                        field.onChange(
                          e.target.value.replace(/\D/g, "").slice(0, 10),
                        ),
                      slotProps: {
                        htmlInput: { inputMode: "numeric", maxLength: 10 },
                      },
                    })}
                  />
                )}
              />
            ))}
          </div>
          {!DEMO_MODE && (
            <>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5 }}
              >
                You can change the mobile number, logo and cover here. Other
                details need approval, see the sections below.
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  mt: 2.5,
                  alignItems: "stretch",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                <DocumentUpload
                  image
                  title="Restaurant logo"
                  hint="JPG, PNG or WEBP, up to 2 MB"
                  accept=".jpg,.jpeg,.png,.webp"
                  value={vm.logo}
                  onChange={vm.setLogo}
                  currentUrl={vm.details?.logoUrl}
                />
                <DocumentUpload
                  image
                  title="Cover image"
                  hint="JPG, PNG or WEBP, up to 2 MB"
                  accept=".jpg,.jpeg,.png,.webp"
                  value={vm.cover}
                  onChange={vm.setCover}
                  currentUrl={vm.details?.coverUrl}
                />
              </Box>
            </>
          )}
          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}
          >
            <CommonButton onClick={vm.cancel}>Cancel</CommonButton>
            <CommonButton type="submit" variant="contained" disabled={vm.busy}>
              {vm.busy ? "Saving…" : "Save changes"}
            </CommonButton>
          </Box>
        </form>
      </ProfileSection>
      {!DEMO_MODE && (
        <Box sx={{ display: "grid", gap: 2 }}>
          <EditAccordion
            icon={<PlaceOutlined fontSize="small" />}
            title="Location"
            hint="Move your restaurant. Needs admin approval."
          >
            <LocationRequestForm onSent={changes.reload} />
          </EditAccordion>
          <EditAccordion
            icon={<ScheduleOutlined fontSize="small" />}
            title="Operating hours"
            hint="Choose the days and times you take orders."
          >
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Working hours are managed in Settings.
            </Typography>
            <CommonButton
              variant="outlined"
              component={NextLink}
              href="/settings/working-hours"
            >
              Open working hours
            </CommonButton>
          </EditAccordion>
          <EditAccordion
            icon={<AccountBalanceOutlined fontSize="small" />}
            title="Bank account details"
            hint="Where your payouts are sent."
          >
            <BankAccountForm
              onSaved={vm.reloadDetails}
              proofUrl={vm.details?.documents.bankProof}
            />
          </EditAccordion>
          <EditAccordion
            icon={<DescriptionOutlined fontSize="small" />}
            title="Names & documents"
            hint="Restaurant name, GST, PAN and Aadhaar. Needs admin approval."
          >
            <ChangeRequestForm onSent={changes.reload} details={vm.details} />
          </EditAccordion>
          {changes.requests.length > 0 && (
            <CommonCard className="compact-card">
              <ChangeRequestHistory requests={changes.requests} />
            </CommonCard>
          )}
        </Box>
      )}
    </Box>
  );
}
