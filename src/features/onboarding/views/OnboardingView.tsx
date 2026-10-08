"use client";
import { Fragment } from "react";
import { Typography, Alert, Divider } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import {
  steps,
  LAST_STEP,
  fieldGroups,
  documentFields,
  restaurantPhotoFields,
  detailSections,
} from "@/core/constants/onboarding";
import { useOnboardingViewModel } from "../viewmodels/useOnboardingViewModel";
import { RegistrationField } from "../components/RegistrationField";
import { RegistrationUpload } from "../components/RegistrationUpload";
import { LocationSearch } from "../components/LocationSearch";
import { MenuStep } from "../components/MenuStep";
import { HoursStep } from "../components/HoursStep";
import { ReviewStep } from "../components/ReviewStep";
export function OnboardingView() {
  const vm = useOnboardingViewModel(),
    step = vm.currentStep,
    { id, title, description } = steps[step],
    fields = fieldGroups[id] ?? [];
  return (
    <>
      <div className="page-heading">
        <Typography variant="overline">
          STEP {step + 1} OF {steps.length}
        </Typography>
        <Typography variant="h4">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
      </div>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void vm.next();
        }}
      >
        <CommonCard>
          {id === "details" &&
            detailSections.map((section, i) => (
              <Fragment key={section.title}>
                {i > 0 && <Divider sx={{ my: 4 }} />}
                <div className="form-section-heading">
                  <Typography variant="subtitle1" component="h2">
                    {section.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                </div>
                <div className="form-grid section-grid">
                  {section.fields.map((name) => (
                    <RegistrationField
                      key={name}
                      definition={fields.find((f) => f.name === name)!}
                    />
                  ))}
                  {section.photos &&
                    restaurantPhotoFields.map((field) => (
                      <RegistrationUpload key={field.name} {...field} />
                    ))}
                </div>
              </Fragment>
            ))}
          {id !== "details" && fields.length > 0 && (
            <div className="form-grid">
              {id === "location" && <LocationSearch />}
              {fields.map((definition) => (
                <RegistrationField
                  key={definition.name}
                  definition={definition}
                />
              ))}
              {id === "bank" && (
                <RegistrationUpload name="bankProof" label="Bank proof" />
              )}
            </div>
          )}
          {id === "documents" && (
            <div className="form-grid">
              {documentFields.map((doc) => (
                <div className="upload document" key={doc.file}>
                  <Typography variant="subtitle2">{doc.label} *</Typography>
                  <RegistrationField definition={doc.number} />
                  <RegistrationUpload
                    name={doc.file}
                    label={`Upload ${doc.label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          )}
          {id === "menu" && <MenuStep />}
          {id === "hours" && <HoursStep />}
          {id === "review" && <ReviewStep onEdit={vm.go} />}
        </CommonCard>
        {vm.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {vm.error}
          </Alert>
        )}
        <div className="actions">
          <CommonButton
            startIcon={<ArrowBack />}
            disabled={step === 0 || vm.busy}
            onClick={() => vm.go(step - 1)}
          >
            Back
          </CommonButton>
          <CommonButton variant="contained" type="submit" disabled={vm.busy}>
            {vm.busy
              ? "Submitting…"
              : step === LAST_STEP
                ? "Submit for approval"
                : "Save & continue"}
          </CommonButton>
        </div>
      </form>
    </>
  );
}
