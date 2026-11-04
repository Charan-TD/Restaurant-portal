"use client";
import { useState } from "react";
import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { tokens } from "@/core/theme/tokens";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import type { RestaurantDetails } from "../services/restaurantApi";
import { BankAccountForm } from "./BankAccountForm";
import { FactTile, SubHeading } from "./PaneParts";
import { PaneHeading } from "./PaneHeading";

/** Where payouts go, and a way to replace the account. */
export function BankPane({
  details,
  onSaved,
}: {
  details?: RestaurantDetails | null;
  onSaved: () => void;
}) {
  const [changing, setChanging] = useState(false),
    bank = details?.bank,
    last4 = bank?.account ? `••${bank.account.slice(-4)}` : "";
  return (
    <>
      <PaneHeading
        title="Bank account"
        subtitle="Where we send your weekly payouts"
      />
      <Box sx={{ p: 3, display: "grid", gap: 3.5 }}>
        <Box>
          <SubHeading>Payout account</SubHeading>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: 2,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.input,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                borderRadius: "10px",
                color: tokens.color.info,
                bgcolor: tokens.color.infoBg,
              }}
            >
              <AccountBalanceOutlined />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>
                {bank?.bank ? `${bank.bank} ${last4}` : "No bank account added"}
              </Typography>
              <Typography noWrap sx={{ fontSize: 13, color: tokens.color.textMuted }}>
                {[bank?.holder, bank?.ifsc && `IFSC ${bank.ifsc}`]
                  .filter(Boolean)
                  .join(" · ") || "Add an account to receive payouts"}
              </Typography>
            </Box>
            <CommonButton
              variant="outlined"
              startIcon={<EditOutlined />}
              onClick={() => setChanging((v) => !v)}
            >
              {changing ? "Close" : bank?.bank ? "Change account" : "Add account"}
            </CommonButton>
          </Box>
        </Box>
        {changing && (
          <BankAccountForm
            onSaved={() => {
              onSaved();
              setChanging(false);
            }}
            proofUrl={details?.documents.bankProof}
          />
        )}
        <Box>
          <SubHeading>Payout schedule</SubHeading>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            <FactTile label="Frequency" value="—" />
            <FactTile label="Next payout" value="—" />
            <FactTile label="Last payout" value="—" />
          </Box>
        </Box>
        <Box>
          <Box
            sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}
          >
            <SubHeading>Recent payouts</SubHeading>
            <NextLink
              href="/payments"
              style={{ color: tokens.color.link, fontSize: 14, fontWeight: 600 }}
            >
              View all in Payments
            </NextLink>
          </Box>
          <Typography sx={{ fontSize: 14, color: tokens.color.textMuted }}>
            Your payouts will be listed here.
          </Typography>
        </Box>
      </Box>
    </>
  );
}
