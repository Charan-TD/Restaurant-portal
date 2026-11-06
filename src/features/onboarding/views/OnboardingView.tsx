"use client";
import type { ReactNode } from "react";
import { Alert, Box, Typography } from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { cardSx, tokens } from "@/core/theme/tokens";
import {
  steps,
  fieldGroups,
  type StepId,
} from "@/core/constants/onboarding";
import { useOnboardingViewModel } from "../viewmodels/useOnboardingViewModel";
import { RegistrationField } from "../components/RegistrationField";
import { RegistrationUpload } from "../components/RegistrationUpload";
import { LocationSearch } from "../components/LocationSearch";
import { DocumentsStep } from "../components/DocumentsStep";
import { HoursStep } from "../components/HoursStep";
import { MenuStep } from "../components/MenuStep";
import { ReviewStep } from "../components/ReviewStep";

/** A titled block of a step. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ "& + &": { mt: 3.5 } }}>
      {title && (
        <Typography
          component="h2"
          sx={{ mb: 1.5, fontSize: 16, fontWeight: 700 }}
        >
          {title}
        </Typography>
      )}
      {children}
    </Box>
  );
}

/** Fields in two columns on wide screens, one on phones. */
const Grid = ({ children }: { children: ReactNode }) => (
  <Box
    sx={{
      display: "grid",
      gap: 2.5,
      alignItems: "start",
      gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
    }}
  >
    {children}
  </Box>
);

/** One field of a step by name; `wide` spans both columns. */
function Field({
  step,
  name,
  wide,
}: {
  step: StepId;
  name: string;
  wide?: boolean;
}) {
  const definition = fieldGroups[step]?.find((f) => f.name === name);
  if (!definition) return null;
  return (
    <Box
      sx={{
        gridColumn: wide || definition.fullWidth ? { md: "1 / -1" } : undefined,
        minWidth: 0,
      }}
    >
      <RegistrationField definition={definition} />
    </Box>
  );
}

function Banner({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.25,
        p: 1.75,
        mb: 3,
        fontSize: 13,
        borderRadius: "12px",
        bgcolor: tokens.color.infoBg,
        border: `1px solid ${tokens.color.info}33`,
      }}
    >
      <InfoOutlined
        sx={{ fontSize: 18, color: tokens.color.info, mt: "1px" }}
      />
      <Box>
        {title && (
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
            {title}
          </Typography>
        )}
        {children}
      </Box>
    </Box>
  );
}

function StepBody({
  id,
  locked,
  onEdit,
}: {
  id: StepId;
  locked: boolean;
  onEdit: (step: number) => void;
}) {
  switch (id) {
    case "details":
      return (
        <>
          {locked && (
            <Banner title="Restaurant details are saved">
              These cannot be changed here any more. To correct something,
              contact TrainDhaba support.
            </Banner>
          )}
          <Box inert={locked} sx={{ opacity: locked ? 0.6 : 1 }}>
            <Section title="Logo and cover photo">
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                <RegistrationUpload
                  name="logo"
                  label="Restaurant logo"
                  accept="picture"
                  variant="logo"
                />
                <RegistrationUpload
                  name="coverPhoto"
                  label="Add cover photo"
                  accept="picture"
                  variant="cover"
                  hint="Wide, min 1200 × 600 px"
                />
              </Box>
            </Section>
            <Section title="Basic details">
              <Grid>
                <Field step="details" name="restaurantName" />
                <Field step="details" name="ownerName" />
                <Field step="details" name="mobile" />
                <Field step="details" name="email" />
                <Field step="details" name="password" />
                <Field step="details" name="confirmPassword" />
              </Grid>
            </Section>
            <Section title="About your restaurant">
              <Grid>
                <Field step="details" name="restaurantType" />
                <Field step="details" name="cuisines" />
                <Field step="details" name="customerContact" />
              </Grid>
            </Section>
            <Section title="">
              <Field step="details" name="foodServed" />
            </Section>
            <Section title="">
              <Field step="details" name="riderOwner" />
            </Section>
          </Box>
        </>
      );
    case "location":
      return (
        <>
          <Section title="Pin your restaurant">
            <div className="form-grid">
              <LocationSearch />
            </div>
          </Section>
          <Section title="Address">
            <Grid>
              <Field step="location" name="building" />
              <Field step="location" name="landmark" />
              <Field step="location" name="city" />
              <Field step="location" name="state" />
              <Field step="location" name="pincode" />
            </Grid>
          </Section>
        </>
      );
    case "documents":
      return <DocumentsStep />;
    case "bank":
      return (
        <>
          <Banner title="Payouts every Friday">
            Money for orders from Friday to Thursday reaches this account the
            next Friday.
          </Banner>
          <Section title="Bank account">
            <Grid>
              <Field step="bank" name="accountHolder" />
              <Field step="bank" name="accountNumber" />
              <Field step="bank" name="confirmAccountNumber" />
              <Field step="bank" name="ifsc" />
              <Field step="bank" name="bankName" />
            </Grid>
          </Section>
          <Section title="Cancelled cheque *">
            <RegistrationUpload
              name="bankProof"
              label="Cancelled cheque or passbook page"
              note="Shows your name, account number and IFSC"
              variant="row"
            />
          </Section>
        </>
      );
    case "menu":
      return <MenuStep />;
    case "hours":
      return <HoursStep />;
    case "review":
      return <ReviewStep onEdit={onEdit} />;
  }
}

/** Registration: one step at a time, in a card with the step's title on top. */
export function OnboardingView() {
  const vm = useOnboardingViewModel(),
    step = vm.currentStep,
    { id, title, description } = steps[step];
  return (
    <>
      {vm.restoring && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loading your saved registration…
        </Alert>
      )}
      {vm.restored && (
        <ToastAlert
          severity="success"
          onClose={vm.dismissRestored}
          sx={{ mb: 2 }}
        >
          Welcome back. We restored your saved registration, so you can carry on
          from where you stopped. Documents you already uploaded are saved; you
          only need to upload them again if you change that step.
        </ToastAlert>
      )}
      <Box
        component="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void vm.next();
        }}
        sx={{ ...cardSx, overflow: "hidden" }}
      >
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2.5,
            borderBottom: `1px solid ${tokens.color.borderSubtle}`,
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.4px",
              color: tokens.color.textMuted,
            }}
          >
            STEP {step + 1} OF {steps.length}
          </Typography>
          <Typography
            component="h1"
            sx={{ fontSize: 22, lineHeight: "28px", fontWeight: 700 }}
          >
            {title}
          </Typography>
          <Typography sx={{ fontSize: 14, color: tokens.color.textMuted }}>
            {description}
          </Typography>
        </Box>
        <Box sx={{ p: 3 }}>
          <StepBody id={id} locked={vm.detailsLocked} onEdit={vm.go} />
          {vm.error && (
            <ToastAlert severity="error" sx={{ mt: 3 }}>
              {vm.error}
            </ToastAlert>
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: step > 0 ? "space-between" : "flex-end",
            gap: 1.5,
            px: 3,
            py: 2.5,
            borderTop: `1px solid ${tokens.color.borderSubtle}`,
          }}
        >
          {step > 0 && (
            <CommonButton
              variant="text"
              disabled={vm.busy}
              onClick={() => vm.go(step - 1)}
            >
              Back
            </CommonButton>
          )}
          <CommonButton
            variant="contained"
            type="submit"
            disabled={vm.busy || vm.restoring}
          >
            {vm.busy ? "Saving…" : "Save and continue"}
          </CommonButton>
        </Box>
      </Box>
    </>
  );
}
