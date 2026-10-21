"use client";

import { useMemo, useState } from "react";
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
  type DateRange,
  type FilterOption,
} from "../components/CustomerToolbar";
import { ListFooter, PAGE_SIZE } from "../components/ListFooter";
import { RatingValue } from "../components/RatingValue";
import { sampleCustomers, type CustomerRow } from "../models/sampleCustomers";

type CustomerFilter = "items" | "orders" | "paid";

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

const sorters: Record<
  CustomerFilter,
  (a: CustomerRow, b: CustomerRow) => number
> = {
  items: (a, b) => b.items.length - a.items.length,
  orders: (a, b) => b.orders - a.orders,
  paid: (a, b) => b.spent - a.spent,
};

const headCell = {
  fontWeight: 600,
  color: "text.primary",
  bgcolor: "#f3f4f2",
  whiteSpace: "nowrap",
};

/** Customers who ordered from the restaurant (static sample data for now). */
export function CustomersListView() {
  const [search, setSearch] = useState(""),
    [range, setRange] = useState<DateRange>("Last 30 days"),
    [filter, setFilter] = useState<CustomerFilter | null>(null),
    [page, setPage] = useState(1);

  const customers = useMemo(() => {
    const term = search.trim().toLowerCase(),
      list = sampleCustomers.filter(
        (c) =>
          !term ||
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term),
      );
    return filter ? [...list].sort(sorters[filter]) : list;
  }, [search, filter]);

  const lastPage = Math.max(1, Math.ceil(customers.length / PAGE_SIZE)),
    current = Math.min(page, lastPage),
    rows = customers.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    average =
      sampleCustomers.reduce((sum, c) => sum + c.rating, 0) /
      sampleCustomers.length;

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
          value={sampleCustomers.length}
          change="12%"
        />
        <CustomerStatCard
          icon={<EmojiEventsOutlined />}
          label="Active customers"
          value={sampleCustomers.filter((c) => c.orders >= 5).length}
          change="8%"
          tint="#fdf3dc"
          iconColor="#e09b00"
        />
        <CustomerStatCard
          icon={<StarRounded />}
          label="Average rating"
          value={average.toFixed(1)}
          change="0.2"
        />
      </Box>
      <CommonCard>
        <CustomerToolbar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search customers by name or phone number..."
          range={range}
          onRange={setRange}
          filter={filter}
          onFilter={(value) => {
            setFilter(value);
            setPage(1);
          }}
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
              {rows.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <CustomerAvatar name={c.name} />
                      <div>
                        <Typography sx={{ fontWeight: 600 }}>
                          {c.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {c.phone}
                        </Typography>
                      </div>
                    </Box>
                  </TableCell>
                  <TableCell>{c.orderId}</TableCell>
                  <TableCell>{formatRupees(c.spent)}</TableCell>
                  <TableCell>
                    <ItemsSummary items={c.items} />
                  </TableCell>
                  <TableCell>
                    <RatingValue rating={c.rating} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton aria-label={`More options for ${c.name}`}>
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    No customers match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <ListFooter
          page={current}
          total={customers.length}
          noun="customers"
          onPage={setPage}
        />
      </CommonCard>
    </>
  );
}
