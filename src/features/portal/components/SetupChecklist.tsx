"use client";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import PedalBikeOutlined from "@mui/icons-material/PedalBikeOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import { cardSx, tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import type { GoLiveSetup } from "../viewmodels/useGoLiveSetup";

const Done = () => (
  <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.color.success }}>
    Done
  </Typography>
);

function Item({
  icon,
  title,
  note,
  action,
}: {
  icon: ReactNode;
  title: string;
  note: string;
  action: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 2,
        "& + &": { borderTop: `1px solid ${tokens.color.borderSubtle}` },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "12px",
          color: tokens.color.primary,
          bgcolor: tokens.color.primarySubtle,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{title}</Typography>
        <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
          {note}
        </Typography>
      </Box>
      {action}
    </Box>
  );
}

/** Shown to an approved restaurant until its menu (and own riders) are added. */
export function SetupChecklist({
  setup,
  restaurantName,
}: {
  setup: GoLiveSetup;
  restaurantName: string;
}) {
  const router = useRouter(),
    total = setup.ridersNeeded ? 3 : 2,
    done =
      1 + Number(setup.menuDone) + Number(setup.ridersNeeded && setup.ridersDone);
  return (
    <Box sx={{ ...cardSx, maxWidth: 760, mx: "auto", mt: 3, p: { xs: 2.5, md: 5 } }}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          fontSize: 11,
          lineHeight: "22px",
          fontWeight: 700,
          letterSpacing: "0.4px",
          textTransform: "uppercase",
          borderRadius: "6px",
          color: tokens.color.success,
          bgcolor: tokens.color.successBg,
        }}
      >
        <CheckOutlined sx={{ fontSize: 13 }} />
        You’re approved
      </Box>
      <Typography component="h2" sx={{ mt: 1, fontSize: 26, fontWeight: 700 }}>
        Finish setup to start getting orders
      </Typography>
      <Typography sx={{ mt: 1, fontSize: 15, color: tokens.color.textMuted }}>
        Passengers can order from {restaurantName} once your menu
        {setup.ridersNeeded ? " and riders are" : " is"} ready.
      </Typography>
      <Typography sx={{ mt: 2.5, fontSize: 13, fontWeight: 700 }}>
        {done} of {total} done
      </Typography>
      <Box sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: tokens.color.muted }}>
        <Box
          sx={{
            width: `${(done / total) * 100}%`,
            height: "100%",
            borderRadius: 3,
            bgcolor: tokens.color.success,
          }}
        />
      </Box>
      <Box sx={{ mt: 2 }}>
        <Item
          icon={<CheckOutlined />}
          title="Restaurant approved"
          note={`${restaurantName} is verified`}
          action={<Done />}
        />
        <Item
          icon={<RestaurantMenuOutlined />}
          title="Add your menu"
          note="Add your dishes with prices, photos and veg / non-veg marks"
          action={
            setup.menuDone ? (
              <Done />
            ) : (
              <CommonButton variant="contained" onClick={() => router.push("/menu/add")}>
                Add menu
              </CommonButton>
            )
          }
        />
        {setup.ridersNeeded && (
          <Item
            icon={<PedalBikeOutlined />}
            title="Add your riders"
            note="Add the staff who take food from your kitchen to the coach"
            action={
              setup.ridersDone ? (
                <Done />
              ) : (
                <CommonButton variant="outlined" onClick={() => router.push("/riders")}>
                  Add riders
                </CommonButton>
              )
            }
          />
        )}
      </Box>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1.5,
          fontSize: 13,
          borderRadius: "10px",
          bgcolor: "#e8f0fe",
        }}
      >
        <InfoOutlined sx={{ fontSize: 18, color: tokens.color.info }} />
        <span>
          You can switch to <b>Online</b> as soon as{" "}
          {setup.ridersNeeded ? "both steps are" : "this step is"} done.
        </span>
      </Box>
    </Box>
  );
}
