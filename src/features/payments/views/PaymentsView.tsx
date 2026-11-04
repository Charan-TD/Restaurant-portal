"use client";
import { useState, type ReactNode } from "react";
import NextLink from "next/link";
import { Box, Typography } from "@mui/material";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import { cardHeaderSx, cardSx, tokens } from "@/core/theme/tokens";
import { DEMO_MODE } from "@/core/constants/config";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { ScreenSurface } from "@/shared/components/layout/ScreenSurface";
import { CountTabs } from "@/shared/components/navigation/CountTabs";
import { useGetRestaurantDetailsQuery } from "@/features/profile/services/restaurantApi";
import { FactTile, ReadField } from "@/features/profile/views/PaneParts";

type TabId = "payouts" | "invoices";

const caption = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  color: tokens.color.textMuted,
} as const;

function BreakdownRow({
  label,
  note,
  strong,
}: {
  label: string;
  note?: string;
  strong?: boolean;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        gap: 2,
        py: 1.25,
        borderTop: strong ? `1px solid ${tokens.color.border}` : 0,
      }}
    >
      <Box>
        <Typography sx={{ fontSize: 14, fontWeight: strong ? 700 : 400 }}>
          {label}
        </Typography>
        {note && (
          <Typography sx={{ fontSize: 12, color: tokens.color.textMuted }}>
            {note}
          </Typography>
        )}
      </Box>
      <Typography sx={{ fontWeight: strong ? 700 : 500 }}>—</Typography>
    </Box>
  );
}

/** A table of columns with a single line under it when there are no rows. */
function EmptyTable({
  columns,
  empty,
}: {
  columns: string[];
  empty: ReactNode;
}) {
  return (
    <Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
          gap: 2,
          px: 3,
          py: 1.25,
          bgcolor: tokens.color.sunken,
          borderTop: `1px solid ${tokens.color.borderSubtle}`,
          borderBottom: `1px solid ${tokens.color.borderSubtle}`,
        }}
      >
        {columns.map((name) => (
          <Typography key={name} sx={caption}>
            {name}
          </Typography>
        ))}
      </Box>
      <Typography sx={{ px: 3, py: 4, color: tokens.color.textMuted }}>
        {empty}
      </Typography>
    </Box>
  );
}

/** Payouts and invoices. The payout figures are not connected to an API yet. */
export function PaymentsView() {
  const [tab, setTab] = useState<TabId>("payouts"),
    { data: details } = useGetRestaurantDetailsQuery(undefined, {
      skip: DEMO_MODE,
    }),
    bank = details?.bank,
    last4 = bank?.account ? `••${bank.account.slice(-4)}` : "";
  return (
    <ScreenSurface>
      <CountTabs
        label="Payments"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "payouts", label: "Payouts" },
          { id: "invoices", label: "Invoices & taxes" },
        ]}
      />
      {tab === "payouts" ? (
        <Box sx={{ mt: 2.5, display: "grid", gap: 2.5 }}>
          <Box
            sx={{
              display: "grid",
              gap: 2.5,
              alignItems: "start",
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" },
            }}
          >
            <Box sx={{ ...cardSx, p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography sx={caption}>Next payout</Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 700 }}>—</Typography>
                  <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
                    Your payout details will show here
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    alignSelf: "flex-start",
                    px: 2,
                    py: 1.25,
                    border: `1px solid ${tokens.color.border}`,
                    borderRadius: tokens.radius.input,
                  }}
                >
                  <AccountBalanceOutlined sx={{ color: tokens.color.textMuted }} />
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {bank?.bank ? `${bank.bank} ${last4}` : "No bank account"}
                    </Typography>
                  </Box>
                  <NextLink
                    href="/profile"
                    style={{ color: tokens.color.primary, fontWeight: 600, fontSize: 14 }}
                  >
                    {bank?.bank ? "Change" : "Add"}
                  </NextLink>
                </Box>
              </Box>
              <Box
                sx={{
                  mt: 2.5,
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
                }}
              >
                <FactTile label="Sales this week" value="—" />
                <FactTile label="Last payout" value="—" />
                <FactTile label="Refunds" value="—" />
              </Box>
            </Box>
            <Box sx={{ ...cardSx, p: 3 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1 }}>
                Payout breakdown
              </Typography>
              <BreakdownRow label="Order value" />
              <BreakdownRow label="TrainDhaba commission" />
              <BreakdownRow label="GST on commission" />
              <BreakdownRow label="Offers you funded" />
              <BreakdownRow label="You get" strong />
            </Box>
          </Box>
          <Box sx={{ ...cardSx, overflow: "hidden" }}>
            <Box sx={{ ...cardHeaderSx, borderBottom: 0 }}>
              <Typography className="title">Payout history</Typography>
            </Box>
            <EmptyTable
              columns={["Week", "Orders", "Sales", "Deductions", "Payout", "Status", "Paid on"]}
              empty="No payouts yet. They will be listed here week by week."
            />
          </Box>
        </Box>
      ) : (
        <Box sx={{ ...cardSx, mt: 2.5, overflow: "hidden" }}>
          <Box sx={cardHeaderSx}>
            <Typography className="title">Invoices &amp; taxes</Typography>
            <Typography className="subtitle">
              Your tax details and monthly commission invoices
            </Typography>
          </Box>
          <Box sx={{ p: 3, display: "grid", gap: 3 }}>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 1.5 }}>
                GST details
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
                }}
              >
                <ReadField label="GSTIN" value={details?.gstin} />
                <ReadField label="Legal name" value={details?.name} />
                <ReadField label="State" value={details?.location.state} />
              </Box>
              <Box sx={{ mt: 2, maxWidth: 420 }}>
                <ReadField label="Billing email" value={details?.email} />
              </Box>
            </Box>
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
                    Commission invoices
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: tokens.color.textMuted }}>
                    TrainDhaba bills you monthly for commission and fees
                  </Typography>
                </Box>
                <CommonButton
                  variant="outlined"
                  startIcon={<FileDownloadOutlined />}
                  disabled
                >
                  Download all
                </CommonButton>
              </Box>
              <Box
                sx={{
                  border: `1px solid ${tokens.color.border}`,
                  borderRadius: tokens.radius.input,
                  overflow: "hidden",
                }}
              >
                <EmptyTable
                  columns={["Month", "Invoice no.", "Commission", "GST 18%", "Status"]}
                  empty="No invoices yet. Monthly invoices will appear here."
                />
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </ScreenSurface>
  );
}
