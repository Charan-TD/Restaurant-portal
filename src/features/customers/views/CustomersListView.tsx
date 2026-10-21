"use client";

import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import MoreVert from "@mui/icons-material/MoreVert";
import PeopleAltOutlined from "@mui/icons-material/PeopleAltOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import StarRounded from "@mui/icons-material/StarRounded";
import LunchDiningOutlined from "@mui/icons-material/LunchDiningOutlined";
import FormatListBulleted from "@mui/icons-material/FormatListBulleted";
import CurrencyRupee from "@mui/icons-material/CurrencyRupee";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CommonCard } from "@/shared/components/layout/CommonCard";
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
  maskPhone,
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

const headCell = {
  fontWeight: 600,
  color: "text.primary",
  bgcolor: "#f3f4f2",
  whiteSpace: "nowrap",
};

/** Customers who ordered from the restaurant, built from its orders. */
export function CustomersListView() {
  const vm = useCustomersViewModel();

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Customers"
        subtitle="View your customers who have ordered from your restaurant."
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
          value={vm.total}
        />
        <CustomerStatCard
          icon={<EmojiEventsOutlined />}
          label="Active customers"
          value={vm.active}
          tint="#fdf3dc"
          iconColor="#e09b00"
        />
        <CustomerStatCard
          icon={<StarRounded />}
          label="Average rating"
          value="–"
        />
      </Box>
      <CommonCard>
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
        <TableContainer sx={{ mt: 2.5 }}>
          <Table sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headCell, borderRadius: "10px 0 0 10px" }}>
                  Customer
                </TableCell>
                <TableCell sx={headCell}>Order ID</TableCell>
                <TableCell sx={headCell}>Amount Spent</TableCell>
                <TableCell sx={headCell}>Ordered Item</TableCell>
                <TableCell sx={headCell}>Rating</TableCell>
                <TableCell
                  sx={{ ...headCell, borderRadius: "0 10px 10px 0" }}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {vm.rows.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <CustomerAvatar name={c.name ?? "Customer"} />
                      <div>
                        <Typography sx={{ fontWeight: 600 }}>
                          {c.name ?? "Customer"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {maskPhone(c.phone)}
                        </Typography>
                      </div>
                    </Box>
                  </TableCell>
                  <TableCell>{c.lastOrderId ?? "–"}</TableCell>
                  <TableCell>{formatRupees(c.spent)}</TableCell>
                  <TableCell>
                    <ItemsSummary items={c.items} />
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">–</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      aria-label={`More options for ${c.name ?? "customer"}`}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {vm.rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    {vm.loading
                      ? "Loading customers…"
                      : vm.error ||
                        (vm.total
                          ? "No customers match your search."
                          : "No customers yet.")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <ListFooter
          page={vm.page}
          total={vm.shown.length}
          noun="customers"
          onPage={vm.setPage}
        />
      </CommonCard>
    </>
  );
}
