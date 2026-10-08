"use client";
import { Controller, useFormContext, type FieldPath } from "react-hook-form";
import type { RegistrationForm } from "../models/registration";
import { CommonUpload } from "@/shared/components/form/CommonUpload";
interface Props {
  name: FieldPath<RegistrationForm>;
  label: string;
  optional?: boolean;
  accept?: "image" | "document";
}
export function RegistrationUpload({ name, label, optional, accept }: Props) {
  const { control } = useFormContext<RegistrationForm>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <CommonUpload
          label={label}
          value={
            typeof File !== "undefined" && field.value instanceof File
              ? field.value
              : null
          }
          onChange={field.onChange}
          optional={optional}
          accept={accept}
          errorMessage={fieldState.error?.message}
        />
      )}
    />
  );
}
