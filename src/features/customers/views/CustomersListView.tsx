"use client";

import { Box, Typography } from "@mui/material";
import PeopleAltOutlined from "@mui/icons-material/PeopleAltOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import StarRounded from "@mui/icons-material/StarRounded";
import LunchDiningOutlined from "@mui/icons-material/LunchDiningOutlined";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import CurrencyRupee from "@mui/icons-material/CurrencyRupee";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { ItemsSummary } from "@/shared/components/feedback/ItemsSummary";
import { formatRupees } from "@/shared/utils/format";
import { CustomerAvatar } from "../components/CustomerAvatar";
import { CustomerStatCard } from "../components/CustomerStatCard";
import {
  CustomerToolbar,
  type FilterOption,
} from "../components/CustomerToolbar";
import { ListFooter } from "../components/ListFooter";
import {
  useCustomersViewModel,
  type CustomerFilter,
} from "../viewmodels/useCustomersViewModel";

const filters: FilterOption<CustomerFilter>[] = [
  {
    value: "items",
    label: "Items",
    icon: <LunchDiningOutlined fontSize="small" />,
  },
  {
    value: "orders",
    label: "Most orders",
    icon: <FormatListBulleted fontSize="small" />,
  },
  {
    value: "paid",
    label: "Most paid",
    icon: <CurrencyRupee fontSize="small" />,
  },
];

/** Column widths shared by the heading row and every customer card. */
const grid =
  "minmax(200px, 1.6fr) minmax(140px, 1.2fr) minmax(110px, 1fr) minmax(100px, 0.8fr) minmax(180px, 1.6fr)";

const seatOf = (order?: { coach?: string; seat?: string }) => {
  const seat = [order?.coach, order?.seat].filter(Boolean).join("/");
  return seat ? `Seat ${seat}` : "";
};

/** Customers who ordered from the restaurant, with their latest order. */
export function CustomersListView() {
  const vm = useCustomersViewModel();

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="All customers"
        subtitle="People who have ordered from you, and how much they have spent."
      />
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <CustomerStatCard
          icon={<PeopleAltOutlined />}
          label="Total customers"
          hint="Everyone who has ordered from your restaurant."
          value={vm.total}
        />
        <CustomerStatCard
          icon={<EmojiEventsOutlined />}
          label="Active customers"
          hint="Customers with 5 or more orders."
          value={vm.active}
        />
        <CustomerStatCard
          icon={<StarRounded />}
          label="Average rating"
          hint="Average of customer reviews. Not available yet."
          value="–"
        />
      </Box>
      <CustomerToolbar
        search={vm.search}
        onSearch={vm.setSearch}
        placeholder="Search customers by name or phone number..."
        range={vm.range}
        onRange={vm.setRange}
        filter={vm.filter}
        onFilter={vm.setFilter}
        filters={filters}
      />
      <Box sx={{ mt: 2.5, overflowX: "auto", contain: "inline-size" }}>
        <Box sx={{ display: "grid", gap: 1.5, minWidth: 960 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: grid,
              gap: 2.5,
              px: 2.5,
              py: 1.25,
              borderRadius: "10px",
              bgcolor: "#f3f4f2",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {[
              "Customer",
              "Train & seat",
              "Order ID",
              "Amount Spent",
              "Ordered Item",
            ].map((heading) => (
              <span key={heading}>{heading}</span>
            ))}
          </Box>
          {vm.rows.map((c) => (
            <Box
              key={c.id}
              sx={{
                display: "grid",
                gridTemplateColumns: grid,
                alignItems: "center",
                gap: 2.5,
                px: 2.5,
                py: 1.75,
                borderRadius: "12px",
                border: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
                transition: "box-shadow .15s, border-color .15s",
                "&:hover": {
                  borderColor: "primary.light",
                  boxShadow: "0 2px 10px rgba(0,0,0,.06)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  minWidth: 0,
                }}
              >
                <CustomerAvatar name={c.name ?? "Customer"} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600 }}>
                    {c.name ?? "Customer"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {c.phone ?? "–"}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 14 }}>
                  {c.lastOrder?.trainName ?? "–"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {seatOf(c.lastOrder)}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 14 }}>
                {c.lastOrder?.id ?? "–"}
              </Typography>
              <Typography sx={{ fontSize: 14 }}>
                {formatRupees(c.spent)}
              </Typography>
              <ItemsSummary
                items={(c.lastOrder?.items ?? []).map((i) =>
                  i.quantity > 1 ? `${i.quantity} × ${i.name}` : i.name,
                )}
              />
            </Box>
          ))}
          {vm.rows.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
              {vm.loading
                ? "Loading customers…"
                : vm.error ||
                  (vm.total
                    ? "No customers match your search."
                    : "No customers yet.")}
            </Typography>
          )}
        </Box>
      </Box>
      <ListFooter
        page={vm.page}
        total={vm.shown.length}
        noun="customers"
        onPage={vm.setPage}
      />
    </>
  );
}
