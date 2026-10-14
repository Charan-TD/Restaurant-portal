"use client";
import { Alert, Box, Skeleton, Switch, Typography } from "@mui/material";
import DoneAllOutlined from "@mui/icons-material/DoneAllOutlined";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { FormField } from "@/shared/components/form/FormField";
import { useWorkingHoursViewModel } from "../viewmodels/useWorkingHoursViewModel";
import { SettingsTabs } from "./SettingsTabs";
export function WorkingHoursView() {
  const vm = useWorkingHoursViewModel();
  return (
    <>
      <PageHeader
        eyebrow="Settings / Working hours"
        title="Working hours"
        subtitle="The days and times customers can order from your restaurant."
      />
      <SettingsTabs />
      {vm.done && (
        <Alert severity="success" onClose={vm.dismissDone} sx={{ mb: 3 }}>
          Working hours updated.
        </Alert>
      )}
      {vm.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {vm.error}
        </Alert>
      )}
      <CommonCard>
        {!vm.loading && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              gap: 1.5,
              p: 2,
              mb: 1,
              borderRadius: "12px",
              bgcolor: "rgba(242,106,46,.06)",
              border: 1,
              borderColor: "rgba(242,106,46,.2)",
            }}
          >
            <Box sx={{ flex: "1 1 180px" }}>
              <Typography sx={{ fontWeight: 700 }}>
                Same hours every day?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set the times once and apply them to all 7 days.
              </Typography>
            </Box>
            <FormField label="Opens at">
              <CommonTextField
                type="time"
                value={vm.bulk.start}
                onChange={(e) =>
                  vm.setBulk({ ...vm.bulk, start: e.target.value })
                }
                sx={{ width: 140 }}
              />
            </FormField>
            <FormField label="Closes at">
              <CommonTextField
                type="time"
                value={vm.bulk.end}
                error={vm.bulkInvalid}
                onChange={(e) => vm.setBulk({ ...vm.bulk, end: e.target.value })}
                sx={{ width: 140 }}
              />
            </FormField>
            <CommonButton
              variant="contained"
              startIcon={<DoneAllOutlined />}
              disabled={vm.bulkInvalid}
              onClick={vm.applyToAll}
            >
              Apply to all days
            </CommonButton>
          </Box>
        )}
        {vm.loading
          ? Array.from({ length: 7 }, (_, i) => (
              <Skeleton key={i} height={56} sx={{ my: 0.5 }} />
            ))
          : vm.days.map((day, i) => (
              <Box
                key={day.day}
                sx={{
                  display: "grid",
                  alignItems: "center",
                  columnGap: 2,
                  rowGap: 1.5,
                  py: 2,
                  borderBottom: i < 6 ? 1 : 0,
                  borderColor: "divider",
                  gridTemplateColumns: {
                    xs: "1fr auto",
                    md: "200px minmax(0, 1fr) auto",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Switch
                    checked={day.open}
                    onChange={(e) => vm.edit(i, { open: e.target.checked })}
                    slotProps={{ input: { "aria-label": `${day.day} open` } }}
                  />
                  <div>
                    <Typography sx={{ fontWeight: 700 }}>{day.day}</Typography>
                    <Typography
                      variant="caption"
                      color={day.open ? "primary.main" : "text.disabled"}
                    >
                      {day.open ? "Open" : "Closed"}
                    </Typography>
                  </div>
                </Box>
                {day.open ? (
                  <>
                    <Box
                      sx={{
                        gridColumn: { xs: "1 / -1", md: 2 },
                        gridRow: { xs: 2, md: 1 },
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                        maxWidth: 440,
                      }}
                    >
                      <FormField label="Opens at">
                        <CommonTextField
                          type="time"
                          size="small"
                          value={day.start}
                          onChange={(e) => vm.edit(i, { start: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Closes at">
                        <CommonTextField
                          type="time"
                          size="small"
                          value={day.end}
                          error={day.end <= day.start}
                          helperText={
                            day.end <= day.start
                              ? "Must be after opening"
                              : undefined
                          }
                          onChange={(e) => vm.edit(i, { end: e.target.value })}
                        />
                      </FormField>
                    </Box>
                  </>
                ) : (
                  <Typography
                    color="text.disabled"
                    sx={{ gridColumn: { xs: "1 / -1", md: 2 } }}
                  >
                    Not taking orders
                  </Typography>
                )}
              </Box>
            ))}
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}
        >
          <CommonButton onClick={vm.reset} disabled={!vm.dirty || vm.busy}>
            Discard
          </CommonButton>
          <CommonButton
            variant="contained"
            onClick={vm.save}
            disabled={!vm.dirty || vm.busy || vm.loading || !!vm.problem}
          >
            {vm.busy ? "Saving…" : "Save working hours"}
          </CommonButton>
        </Box>
      </CommonCard>
    </>
  );
}
