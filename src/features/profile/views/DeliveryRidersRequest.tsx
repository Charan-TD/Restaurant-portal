"use client";
import { useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { errorMessage } from "@/shared/utils/errors";
import { useRidersOwner } from "@/features/riders/viewmodels/useRidersOwner";
import {
  useRequestProfileChangeMutation,
  type ProfileChangeRequest,
  type RidersOwner,
} from "../services/restaurantApi";
/** The two ways orders reach the train, in the order they are shown. */
const choices: {
  owner: RidersOwner;
  title: string;
  description: string;
  recommended?: boolean;
  button: string;
  pending: string;
}[] = [
  {
    owner: "Traindhaba",
    title: "TrainDhaba rider",
    description:
      "We send a delivery partner to pick up and hand over at the coach.",
    recommended: true,
    button: "Request TrainDhaba riders",
    pending:
      "Your request to use TrainDhaba riders is waiting for admin approval.",
  },
  {
    owner: "restaurant",
    title: "My own riders",
    description:
      "Your staff delivers to the coach. Add their name and phone for each order.",
    button: "Request to use my own riders",
    pending:
      "Your request to use your own riders is waiting for admin approval.",
  },
];
/**
 * Lets a restaurant ask to switch who delivers its orders: from its own
 * riders to TrainDhaba's, or back. The server keeps the current riders until
 * an admin approves the request.
 */
export function DeliveryRidersRequest({
  requests,
  onSent,
}: {
  requests: ProfileChangeRequest[];
  onSent: () => void;
}) {
  const { ownRiders, trainDhabaRiders } = useRidersOwner(),
    [request, { isLoading }] = useRequestProfileChangeMutation(),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false),
    [picked, setPicked] = useState<RidersOwner | null>(null),
    current: RidersOwner | null = trainDhabaRiders
      ? "Traindhaba"
      : ownRiders
        ? "restaurant"
        : null,
    selected = picked ?? current,
    target = choices.find((c) => c.owner === selected),
    pending =
      sent ||
      requests.some(
        (r) =>
          r.status.toLowerCase() === "pending" &&
          r.fields.includes("riders_owner"),
      );
  const send = async () => {
    if (!target) return;
    setError("");
    try {
      await request({ riders_owner: target.owner }).unwrap();
      setSent(true);
      onSent();
    } catch (e) {
      const message = errorMessage(e);
      // The server's API docs accept riders_owner here, but the live server
      // does not yet ("Fields not allowed on this page: riders_owner").
      setError(
        /not allowed.*riders_owner/i.test(message)
          ? "Changing delivery riders isn't available yet. Please contact TrainDhaba support to switch."
          : message,
      );
    }
  };
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box
        role="radiogroup"
        aria-label="Who delivers to the train"
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {choices.map((choice) => {
          const active = selected === choice.owner;
          return (
            <ButtonBase
              key={choice.owner}
              role="radio"
              aria-checked={active}
              disabled={!current}
              onClick={() => {
                setPicked(choice.owner);
                setError("");
              }}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                gap: 1.5,
                p: 2,
                textAlign: "left",
                borderRadius: "12px",
                border: `${active ? 2 : 1.5}px solid ${
                  active ? tokens.color.borderStrong : tokens.color.borderInput
                }`,
                bgcolor: tokens.color.card,
              }}
            >
              <Box
                sx={{
                  mt: 0.25,
                  width: 20,
                  height: 20,
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  border: `2px solid ${
                    active ? tokens.color.primary : tokens.color.borderInput
                  }`,
                }}
              >
                {active && (
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: tokens.color.primary,
                    }}
                  />
                )}
              </Box>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
                    {choice.title}
                  </Typography>
                  {choice.recommended && (
                    <Box
                      component="span"
                      sx={{
                        px: 0.75,
                        borderRadius: tokens.radius.badge,
                        fontSize: 11,
                        lineHeight: "18px",
                        fontWeight: 700,
                        letterSpacing: "0.4px",
                        textTransform: "uppercase",
                        color: tokens.color.success,
                        bgcolor: tokens.color.successBg,
                      }}
                    >
                      Recommended
                    </Box>
                  )}
                </Box>
                <Typography
                  sx={{ mt: 0.25, fontSize: 13, color: tokens.color.textMuted }}
                >
                  {choice.description}
                </Typography>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
      {error && <ToastAlert severity="error">{error}</ToastAlert>}
      {pending ? (
        <ToastAlert severity="info">
          {(choices.find((c) => c.owner !== current) ?? choices[0]).pending}
        </ToastAlert>
      ) : (
        current &&
        selected !== current &&
        target && (
          <Box>
            <CommonButton
              variant="contained"
              disabled={isLoading}
              onClick={() => void send()}
            >
              {isLoading ? "Sending…" : target.button}
            </CommonButton>
            <Typography
              sx={{ mt: 1, fontSize: 12, color: tokens.color.textSubtle }}
            >
              Your current riders stay in use until an admin approves the
              change.
            </Typography>
          </Box>
        )
      )}
    </Box>
  );
}
