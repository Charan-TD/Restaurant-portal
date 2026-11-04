"use client";
import { useState } from "react";
import {
  Avatar,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Radio,
  Typography,
} from "@mui/material";
import PersonAddAltOutlined from "@mui/icons-material/PersonAddAltOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import { COUNTRY_CODE } from "@/features/onboarding/models/registration";
import { DEMO_MODE } from "@/core/constants/config";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import type { Rider } from "../models/rider";
import { useRidersViewModel } from "../viewmodels/useRidersViewModel";
import { AddRiderDialog } from "./AddRiderDialog";
/**
 * Pick which of the restaurant's riders takes an order, or add a new rider
 * on the spot; a rider added here is selected straight away. The orders API
 * requires a rider to hand an order over, so one must be chosen.
 */
export function AssignRiderDialog({
  open,
  orderLabel,
  confirmLabel = "Assign and hand over",
  busy,
  onClose,
  onAssign,
}: {
  open: boolean;
  /** Shown in the title, e.g. the order number. */
  orderLabel: string;
  /** The confirm button, e.g. "Assign and mark picked up". */
  confirmLabel?: string;
  busy?: boolean;
  onClose: () => void;
  onAssign: (rider: Rider) => void;
}) {
  const vm = useRidersViewModel({ skip: !open || DEMO_MODE }),
    { riders, loading } = vm,
    [picked, setPicked] = useState<string>(),
    // The add response has no usable id, so a new rider is found by phone.
    [addedPhone, setAddedPhone] = useState<string>(),
    [adding, setAdding] = useState(false),
    chosen =
      riders.find((r) => r.id === picked) ??
      riders.find((r) => !picked && r.phone === addedPhone);
  return (
    <>
      <Dialog
        open={open && !adding}
        onClose={busy ? undefined : onClose}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Assign a rider · {orderLabel}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {riders.length ? (
            <List disablePadding>
              {riders.map((rider) => (
                <ListItemButton
                  key={rider.id}
                  selected={chosen?.id === rider.id}
                  onClick={() => setPicked(rider.id)}
                >
                  <ListItemAvatar>
                    <Avatar src={rider.photoUrl} alt={rider.name}>
                      <PersonOutlined />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={rider.name}
                    secondary={`${COUNTRY_CODE} ${rider.phone}`}
                    slotProps={{ primary: { sx: { fontWeight: 700 } } }}
                  />
                  <Radio
                    edge="end"
                    checked={chosen?.id === rider.id}
                    tabIndex={-1}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
              <Typography>
                {loading
                  ? "Loading riders…"
                  : "You have not added any riders yet. Add one to hand this order over."}
              </Typography>
            </Box>
          )}
          {!loading && (
            <Box
              sx={{
                p: 1.5,
                borderTop: riders.length ? 1 : 0,
                borderColor: "divider",
              }}
            >
              <CommonButton
                fullWidth
                variant="text"
                disabled={busy}
                startIcon={<PersonAddAltOutlined />}
                onClick={() => setAdding(true)}
              >
                Add a new rider
              </CommonButton>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <CommonButton variant="outlined" disabled={busy} onClick={onClose}>
            Cancel
          </CommonButton>
          <CommonButton
            variant="contained"
            disabled={!chosen || loading || busy}
            onClick={() => chosen && onAssign(chosen)}
          >
            {confirmLabel}
          </CommonButton>
        </DialogActions>
      </Dialog>
      <AddRiderDialog
        open={open && adding}
        saving={vm.adding}
        onClose={() => setAdding(false)}
        onAdd={async (form) => {
          const failure = await vm.addRider(form);
          if (!failure) {
            setPicked(undefined);
            setAddedPhone(form.phone);
          }
          return failure;
        }}
      />
    </>
  );
}
