"use client";
import { Controller } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import NextLink from "next/link";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { DocumentUpload } from "@/shared/components/form/DocumentUpload";
import {
  FormField,
  FormGrid,
  prefixAdornment,
} from "@/shared/components/form/FormField";
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
const fields: {
  name: keyof ProfileForm;
  label: string;
  type?: string;
  placeholder: string;
}[] = [
  { name: "restaurantName", label: "Restaurant name", placeholder: "Restaurant name" },
  { name: "name", label: "Owner name", placeholder: "Owner name" },
  { name: "phone", label: "Mobile number", type: "tel", placeholder: "10-digit mobile number" },
  { name: "email", label: "Email", type: "email", placeholder: "you@example.com" },
  { name: "city", label: "City", placeholder: "City" },
];
/** The edit page: direct changes first, then the sections that need approval. */
export function EditProfileView({ vm }: { vm: ProfileViewModel }) {
  const changes = useChangeRequests(),
    details = vm.details;
  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      <ProfileSection
        icon={<StorefrontOutlined />}
        title="Restaurant details"
        subtitle={
          DEMO_MODE
            ? "Update your restaurant details."
            : "You can change the mobile number, logo and cover here."
        }
      >
        <form noValidate onSubmit={vm.save}>
          <FormGrid>
            {fields.map((item) => {
              const locked = !DEMO_MODE && item.name !== "phone",
                id = `profile-${item.name}`;
              return (
                <Controller
                  key={item.name}
                  name={item.name}
                  control={vm.form.control}
                  render={({ field, fieldState }) => (
                    <FormField label={item.label} htmlFor={id}>
                      <CommonTextField
                        {...field}
                        id={id}
                        type={item.type}
                        placeholder={item.placeholder}
                        error={!!fieldState.error}
                        helperText={
                          fieldState.error?.message ??
                          (locked ? "Needs admin approval to change." : undefined)
                        }
                        disabled={locked}
                        {...(item.name === "phone" && {
                          onChange: (e) =>
                            field.onChange(
                              e.target.value.replace(/\D/g, "").slice(0, 10),
                            ),
                          slotProps: {
                            htmlInput: { inputMode: "numeric", maxLength: 10 },
                            input: { startAdornment: prefixAdornment(COUNTRY_CODE) },
                          },
                        })}
                        {...(locked && {
                          slotProps: {
                            input: {
                              endAdornment: (
                                <LockOutlined
                                  fontSize="small"
                                  sx={{ color: "text.disabled" }}
                                />
                              ),
                            },
                          },
                        })}
                      />
                    </FormField>
                  )}
                />
              );
            })}
          </FormGrid>
          {!DEMO_MODE && (
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>
                Logo and cover
              </Typography>
              <FormGrid>
                <DocumentUpload
                  image
                  title="Restaurant logo"
                  hint="JPG, PNG or WEBP, up to 2 MB"
                  accept=".jpg,.jpeg,.png,.webp"
                  value={vm.logo}
                  onChange={vm.setLogo}
                  currentUrl={details?.logoUrl}
                />
                <DocumentUpload
                  image
                  title="Cover image"
                  hint="JPG, PNG or WEBP, up to 2 MB"
                  accept=".jpg,.jpeg,.png,.webp"
                  value={vm.cover}
                  onChange={vm.setCover}
                  currentUrl={details?.coverUrl}
                />
              </FormGrid>
            </Box>
          )}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              mt: 3,
              pt: 3,
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <CommonButton variant="outlined" color="inherit" onClick={vm.cancel}>
              Cancel
            </CommonButton>
            <CommonButton type="submit" variant="contained" disabled={vm.busy}>
              {vm.busy ? "Saving…" : "Save changes"}
            </CommonButton>
          </Box>
        </form>
      </ProfileSection>
      {!DEMO_MODE && (
        <>
          <ProfileSection
            icon={<PlaceOutlined />}
            title="Location"
            subtitle="Move your restaurant. Needs admin approval."
          >
            <LocationRequestForm onSent={changes.reload} />
          </ProfileSection>
          <ProfileSection
            icon={<ScheduleOutlined />}
            title="Operating hours"
            subtitle="Choose the days and times you take orders."
            action={
              <CommonButton
                variant="outlined"
                component={NextLink}
                href="/settings/working-hours"
              >
                Open working hours
              </CommonButton>
            }
          >
            <Typography color="text.secondary">
              Working hours are managed in Settings.
            </Typography>
          </ProfileSection>
          <ProfileSection
            icon={<AccountBalanceOutlined />}
            title="Bank account details"
            subtitle="Where your payouts are sent."
          >
            <BankAccountForm
              onSaved={vm.reloadDetails}
              proofUrl={details?.documents.bankProof}
            />
          </ProfileSection>
          <ProfileSection
            icon={<DescriptionOutlined />}
            title="Names & documents"
            subtitle="Restaurant name, GST, PAN and Aadhaar. Needs admin approval."
          >
            <ChangeRequestForm onSent={changes.reload} details={details} />
          </ProfileSection>
          {changes.requests.length > 0 && (
            <CommonCard className="profile-card">
              <ChangeRequestHistory requests={changes.requests} />
            </CommonCard>
          )}
        </>
      )}
    </Box>
  );
}
