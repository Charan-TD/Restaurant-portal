import { Fragment } from "react";
import { Box, Typography } from "@mui/material";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import { tokens } from "@/core/theme/tokens";
import type { OwnFileStage } from "../viewmodels/useOwnFileImportViewModel";

/** The steps of the import; Column setup only appears when the columns need confirming. */
export function ImportStepper({ stage }: { stage: OwnFileStage }) {
  const steps: { key: OwnFileStage; label: string }[] = [
      { key: "choose", label: "Upload menu" },
      ...(stage === "columns" ? [{ key: "columns" as const, label: "Column setup" }] : []),
      { key: "review", label: "Review & edit" },
      { key: "check", label: "Check menu" },
      { key: "done", label: "Done" },
    ],
    current = steps.findIndex((s) => s.key === stage);
  return (
    <Box component="ol" aria-label="Import steps" sx={{ display: "flex", alignItems: "center", gap: 1.5, m: 0, mb: 3, p: 0, listStyle: "none", overflowX: "auto" }}>
      {steps.map((step, i) => {
        const done = i < current || stage === "done",
          active = i === current && stage !== "done";
        return (
          <Fragment key={step.key}>
            <Box component="li" aria-current={active ? "step" : undefined} sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: "#fff", bgcolor: done || active ? tokens.color.primary : tokens.color.dashed }}>
                {done ? <CheckOutlined sx={{ fontSize: 17 }} /> : i + 1}
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: active ? 700 : 500, color: done || active ? tokens.color.text : tokens.color.textMuted }}>
                {step.label}
              </Typography>
            </Box>
            {i < steps.length - 1 && (
              <Box aria-hidden sx={{ flex: 1, minWidth: 24, height: "1px", bgcolor: tokens.color.border }} />
            )}
          </Fragment>
        );
      })}
    </Box>
  );
}
