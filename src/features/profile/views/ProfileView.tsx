"use client";
import { ToastAlert } from "@/core/providers/ToastProvider";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { useProfileViewModel } from "../viewmodels/useProfileViewModel";
import { EditProfileView } from "./EditProfileView";
import { ProfileDetails } from "./ProfileDetails";
export function ProfileView() {
  const vm = useProfileViewModel();
  return (
    <>
      <PageHeader
        eyebrow={vm.editing ? "Account / Edit profile" : "Account / Profile"}
        title={vm.editing ? "Edit profile" : "My profile"}
        subtitle={
          vm.editing
            ? "Update your details, or ask for changes that need approval."
            : "Your restaurant, location, hours and bank details."
        }
        actions={
          vm.editing && (
            <CommonButton
              variant="outlined"
              startIcon={<ArrowBackOutlined />}
              onClick={vm.cancel}
            >
              Back to profile
            </CommonButton>
          )
        }
      />
      {vm.saved && (
        <ToastAlert severity="success" onClose={vm.dismissSaved} sx={{ mb: 3 }}>
          Profile updated.
        </ToastAlert>
      )}
      {vm.error && (
        <ToastAlert severity="error" sx={{ mb: 3 }}>
          {vm.error}
        </ToastAlert>
      )}
      {vm.editing ? (
        <EditProfileView vm={vm} />
      ) : (
        <ProfileDetails
          vendor={vm.vendor}
          details={vm.details}
          onEdit={vm.startEditing}
        />
      )}
    </>
  );
}
