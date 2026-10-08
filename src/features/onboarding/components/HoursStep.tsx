"use client";
import { Switch, FormControlLabel, FormHelperText } from "@mui/material";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { useHoursViewModel } from "../viewmodels/useHoursViewModel";
export function HoursStep() {
  const vm = useHoursViewModel();
  return (
    <>
      {vm.days.map((day, i) => (
        <div className="day" key={day.day}>
          <div className="day-label">
            <strong>{day.day}</strong>
            <FormControlLabel
              control={
                <Switch
                  checked={day.open}
                  onChange={(e) => vm.updateDay(i, { open: e.target.checked })}
                  slotProps={{ input: { "aria-label": `${day.day} open` } }}
                />
              }
              label={day.open ? "Open" : "Closed"}
            />
          </div>
          {day.open && (
            <div className="shifts">
              {day.shifts.map((shift, j) => (
                <div className="shift" key={j}>
                  <CommonTextField
                    label="Opens at"
                    type="time"
                    value={shift.start}
                    onChange={(e) =>
                      vm.updateShift(i, j, "start", e.target.value)
                    }
                    error={
                      !!vm.form.formState.errors.hours?.[i]?.shifts?.[j]?.start
                    }
                    helperText={
                      vm.form.formState.errors.hours?.[i]?.shifts?.[j]?.start
                        ?.message
                    }
                  />
                  <CommonTextField
                    label="Closes at"
                    type="time"
                    value={shift.end}
                    onChange={(e) =>
                      vm.updateShift(i, j, "end", e.target.value)
                    }
                    error={
                      !!vm.form.formState.errors.hours?.[i]?.shifts?.[j]?.end
                    }
                    helperText={
                      vm.form.formState.errors.hours?.[i]?.shifts?.[j]?.end
                        ?.message
                    }
                  />
                  {j > 0 && (
                    <CommonButton onClick={() => vm.removeShift(i, j)}>
                      Remove
                    </CommonButton>
                  )}
                </div>
              ))}
              <CommonButton onClick={() => vm.addShift(i)}>
                + Add shift
              </CommonButton>
            </div>
          )}
        </div>
      ))}
      {vm.form.formState.errors.hours && (
        <FormHelperText error>
          {vm.form.formState.errors.hours.message ||
            vm.form.formState.errors.hours.root?.message ||
            "Check operating shifts."}
        </FormHelperText>
      )}
    </>
  );
}
