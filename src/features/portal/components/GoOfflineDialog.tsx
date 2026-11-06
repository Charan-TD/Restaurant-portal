"use client";
import { useState } from "react";
import {
  Box,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { DEMO_MODE } from "@/core/constants/config";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { TimeField } from "@/shared/components/form/TimeField";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import {
  DEFAULT_OPENS,
  useGetWorkingHoursQuery,
} from "@/features/profile/services/restaurantApi";
import {
  OFFLINE_REASONS,
  OTHER_REASON,
  REOPEN_CHOICES,
  reopenLabel,
  reopenTime,
  type GoOffline,
  type ReopenChoice,
} from "../models/offline";
/** Asks why the restaurant is stopping orders, and when it comes back. */
export function GoOfflineDialog({
  open,
  inProgress,
  onClose,
  onConfirm,
}: {
  open: boolean;
  /** Orders that still need finishing, whatever the vendor chooses. */
  inProgress: number;
  onClose: () => void;
  onConfirm: (offline: GoOffline) => void;
}) {
  const { data: hours = [] } = useGetWorkingHoursQuery(undefined, {
      skip: !open || DEMO_MODE,
    }),
    [reason, setReason] = useState(""),
    [other, setOther] = useState(""),
    [choice, setChoice] = useState<ReopenChoice>("1h"),
    [picked, setPicked] = useState(""),
    [submitted, setSubmitted] = useState(false),
    now = new Date(),
    tomorrowName = new Date(now.getTime() + 86_400_000).toLocaleDateString(
      "en-US",
      { weekday: "long" },
    ),
    tomorrow = hours.find((d) => d.day === tomorrowName),
    reopenAt = reopenTime(choice, {
      now,
      tomorrowOpens: tomorrow?.open ? tomorrow.start : DEFAULT_OPENS,
      picked,
    }),
    finalReason = reason === OTHER_REASON ? other.trim() : reason,
    reasonError = !reason
      ? "Choose why you are stopping."
      : !finalReason
        ? "Tell us what is going on."
        : "";
  function close() {
    onClose();
    setReason("");
    setOther("");
    setChoice("1h");
    setPicked("");
    setSubmitted(false);
  }
  function confirm() {
    setSubmitted(true);
    if (reasonError || !reopenAt) return;
    onConfirm({ reason: finalReason, reopenAt });
    close();
  }
  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: 4 } } }}
    >
      <DialogContent sx={{ pt: 3.5, pb: 1 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 800 }}>
          Stop taking orders?
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Passengers will see you as closed until you reopen.
        </Typography>
        <Typography sx={{ mt: 3, fontWeight: 700 }} id="offline-reason">
          Why are you stopping?
        </Typography>
        <RadioGroup
          aria-labelledby="offline-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mt: 0.5 }}
        >
          {OFFLINE_REASONS.map((option) => (
            <FormControlLabel
              key={option}
              value={option}
              control={<Radio />}
              label={option}
              slotProps={{ typography: { sx: { fontWeight: 500 } } }}
            />
          ))}
        </RadioGroup>
        {reason === OTHER_REASON && (
          <CommonTextField
            autoFocus
            fullWidth
            size="small"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="What is going on?"
            slotProps={{ htmlInput: { maxLength: 120 } }}
            sx={{ mt: 1 }}
          />
        )}
        {submitted && reasonError && (
          <Typography color="error" sx={{ fontSize: 13, mt: 0.5 }}>
            {reasonError}
          </Typography>
        )}
        <Box
          sx={{
            mt: 3,
            mb: 1.25,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 1,
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>Reopen after</Typography>
          {reopenAt && (
            <Typography
              sx={{ fontSize: 14, fontWeight: 600, color: "success.dark" }}
            >
              Reopens at {reopenLabel(reopenAt, now)}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
          }}
        >
          {REOPEN_CHOICES.map((option) => (
            <ButtonBase
              key={option.value}
              onClick={() => setChoice(option.value)}
              aria-pressed={choice === option.value}
              sx={{
                py: 1.25,
                borderRadius: 2,
                border: 1.5,
                borderColor:
                  choice === option.value ? "text.primary" : "divider",
                fontWeight: choice === option.value ? 700 : 500,
                fontSize: 14,
                bgcolor:
                  choice === option.value ? "background.paper" : "#f6f7f5",
              }}
            >
              {option.label}
            </ButtonBase>
          ))}
        </Box>
        {choice === "pick" && (
          <Box sx={{ mt: 1.5 }}>
            <Typography sx={{ mb: 0.5, fontSize: 13, fontWeight: 600 }}>Reopen at</Typography>
            <TimeField compact width={170} label="Reopen at" value={picked} onChange={setPicked} error={submitted && !reopenAt ? "Pick a time." : undefined} />
          </Box>
        )}
        {inProgress > 0 && (
          <Box
            sx={{
              mt: 2.5,
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "text.secondary",
            }}
          >
            <InfoOutlined sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: 13.5 }}>
              You still need to finish the {inProgress}{" "}
              {inProgress === 1 ? "order" : "orders"} in progress.
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pt: 2, pb: 3, gap: 1.5 }}>
        <CommonButton onClick={close} sx={{ flex: 1 }} color="inherit">
          Cancel
        </CommonButton>
        <CommonButton
          variant="contained"
          color="error"
          onClick={confirm}
          sx={{ flex: 2, py: 1.25 }}
        >
          Stop orders
        </CommonButton>
      </DialogActions>
    </Dialog>
  );
}
