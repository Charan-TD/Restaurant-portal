"use client";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Box, ButtonBase, Typography } from "@mui/material";
import ExpandMoreOutlined from "@mui/icons-material/ExpandMoreOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import WorkOutlineOutlined from "@mui/icons-material/WorkOutlineOutlined";
import { documentFields } from "@/core/constants/onboarding";
import { tokens } from "@/core/theme/tokens";
import type { RegistrationForm } from "../models/registration";
import { useSavedFiles } from "../services/registrationExtras";
import { RegistrationField } from "./RegistrationField";
import { RegistrationUpload } from "./RegistrationUpload";

type Doc = (typeof documentFields)[number];

/** The icon of each document card, as in the design. */
const docIcons: Record<string, React.ReactNode> = {
  "documents.gst": <DescriptionOutlined />,
  "documents.pan": <BadgeOutlined />,
  "documents.fssai": <DescriptionOutlined />,
  "documents.identity": <BadgeOutlined />,
  "documents.businessProof": <WorkOutlineOutlined />,
};
const savedKey: Record<string, string> = {
  "documents.gst": "gst",
  "documents.pan": "pan",
  "documents.fssai": "fssai",
  "documents.identity": "identity",
  "documents.businessProof": "businessProof",
};

function Badge({ label, tone }: { label: string; tone: "muted" | "error" | "success" }) {
  const colors = {
    muted: [tokens.color.textMuted, tokens.color.muted],
    error: [tokens.color.error, tokens.color.errorBg],
    success: [tokens.color.success, tokens.color.successBg],
  }[tone];
  return (
    <Box
      component="span"
      sx={{
        px: 1,
        borderRadius: "6px",
        fontSize: 11,
        lineHeight: "20px",
        fontWeight: 700,
        letterSpacing: "0.4px",
        color: colors[0],
        bgcolor: colors[1],
      }}
    >
      {label}
    </Box>
  );
}

function DocumentCard({ doc, open: asked, onToggle }: { doc: Doc; open: boolean; onToggle: () => void }) {
  const { control, formState } = useFormContext<RegistrationForm>(),
    file = useWatch({ control, name: doc.file }),
    savedFiles = useSavedFiles(),
    uploaded =
      (typeof File !== "undefined" && file instanceof File) ||
      !!(savedFiles as Record<string, boolean>)[savedKey[doc.file]],
    hasError = [doc.number.name, ...(doc.extra ?? []).map((e) => e.name), doc.file].some(
      (name) => !!formState.errors && name.split(".").reduce<unknown>(
        (acc, key) => (acc as Record<string, unknown> | undefined)?.[key],
        formState.errors,
      ),
    ),
    // A card with a problem stays open so the problem is seen.
    open = asked || hasError;
  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: `1px solid ${hasError ? tokens.color.error : tokens.color.border}`,
        bgcolor: open ? tokens.color.sunken : tokens.color.card,
      }}
    >
      <ButtonBase
        onClick={onToggle}
        aria-expanded={open}
        sx={{
          width: "100%",
          justifyContent: "flex-start",
          textAlign: "left",
          gap: 1.5,
          px: 2,
          py: 1.5,
        }}
      >
        <Box sx={{ display: "grid", color: tokens.color.textMuted }}>
          {docIcons[doc.file]}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{doc.label}</Typography>
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>{doc.note}</Typography>
        </Box>
        {uploaded ? (
          <Badge label="UPLOADED" tone="success" />
        ) : doc.optional ? (
          <Badge label="OPTIONAL" tone="muted" />
        ) : (
          <Badge label="REQUIRED" tone="error" />
        )}
        <ExpandMoreOutlined
          sx={{ color: tokens.color.textMuted, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}
        />
      </ButtonBase>
      {open && (
        <Box sx={{ px: 2, pb: 2, display: "grid", gap: 2 }}>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: doc.extra ? "repeat(2, minmax(0, 1fr))" : "1fr",
              },
            }}
          >
            <RegistrationField definition={doc.number} />
            {doc.extra?.map((definition) => (
              <RegistrationField key={definition.name} definition={definition} />
            ))}
          </Box>
          <RegistrationUpload
            name={doc.file}
            label={`Upload ${doc.label}`}
          />
        </Box>
      )}
    </Box>
  );
}

/** The documents step: a card per document that opens to its number and upload. */
export function DocumentsStep() {
  const [open, setOpen] = useState<string | null>(documentFields[0].label);
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <Box
        sx={{
          display: "flex",
          gap: 1.25,
          p: 1.75,
          fontSize: 13,
          borderRadius: "12px",
          bgcolor: tokens.color.infoBg,
          border: `1px solid ${tokens.color.info}33`,
        }}
      >
        <InfoOutlined sx={{ fontSize: 18, color: tokens.color.info, mt: "1px" }} />
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Keep these ready</Typography>
          A PDF, JPG, PNG or WEBP of each document, up to 2 MB. The name must
          match the restaurant or owner name.
        </Box>
      </Box>
      {documentFields.map((doc) => (
        <DocumentCard
          key={doc.label}
          doc={doc}
          open={open === doc.label}
          onToggle={() => setOpen(open === doc.label ? null : doc.label)}
        />
      ))}
    </Box>
  );
}
