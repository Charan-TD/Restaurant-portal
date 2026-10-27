"use client";
import { useState } from "react";
import FilterListOutlined from "@mui/icons-material/FilterListOutlined";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Pagination,
  Typography,
} from "@mui/material";
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { DEMO_MODE } from "@/core/constants/config";
import { useGetOrderCountQuery } from "../services/orderApi";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { OrderCard, OrderListHeadings } from "../components/OrderCard";
import {
  useAllOrdersViewModel,
  type OrderFilter,
} from "../viewmodels/useAllOrdersViewModel";

const filters: { label: string; value: OrderFilter }[] = [
  { label: "All orders", value: undefined },
  { label: "Preparing", value: "Preparing" },
  { label: "Delivered", value: "Delivered" },
];
const moreFilters: { label: string; value: OrderFilter }[] = [
  { label: "New", value: "New" },
  { label: "Packed", value: "Ready" },
  { label: "With rider", value: "HandedOver" },
  { label: "Cancelled", value: "Rejected" },
  { label: "Failed", value: "FAILED" },
];

/** A status filter that shows how many orders have that status. */
function FilterChip({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: OrderFilter;
  selected: boolean;
  onSelect: () => void;
}) {
  const { data: count } = useGetOrderCountQuery(value, { skip: DEMO_MODE });
  return (
    <Chip
      label={count === undefined ? label : `${label} (${count})`}
      clickable
      color={selected ? "primary" : "default"}
      variant={selected ? "filled" : "outlined"}
      onClick={onSelect}
    />
  );
}
/** Every order the restaurant has received: live, completed and cancelled. */
export function AllOrdersView() {
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  const vm = useAllOrdersViewModel(),
    from = vm.total === 0 ? 0 : (vm.page - 1) * vm.pageSize + 1,
    to = Math.min(vm.page * vm.pageSize, vm.total);
  return (
    <>
      <PageHeader
        eyebrow="Orders"
        title="All orders"
        subtitle="Every order you have received, including completed and cancelled ones."
      />
      <CommonCard>
        <CommonTextField
          size="small"
          fullWidth
          value={vm.search}
          onChange={(e) => vm.setSearch(e.target.value)}
          placeholder="Search by order number, customer, phone, train or item…"
          slotProps={{
            htmlInput: { "aria-label": "Search orders", maxLength: 100 },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
          {filters.map((f) => (
            <FilterChip
              key={f.label}
              label={f.label}
              value={f.value}
              selected={vm.status === f.value}
              onSelect={() => vm.setStatus(f.value)}
            />
          ))}
          <Tooltip title="More order filters">
            <IconButton
              aria-label="More order filters"
              aria-haspopup="menu"
              aria-expanded={Boolean(filterAnchor)}
              onClick={(event) => setFilterAnchor(event.currentTarget)}
              color={
                moreFilters.some((filter) => filter.value === vm.status)
                  ? "primary"
                  : "default"
              }
            >
              <FilterListOutlined />
            </IconButton>
          </Tooltip>
          {moreFilters.some((filter) => filter.value === vm.status) && (
            <Chip
              label={
                moreFilters.find((filter) => filter.value === vm.status)?.label
              }
              color="primary"
              onDelete={() => vm.setStatus(undefined)}
            />
          )}
          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
          >
            {moreFilters.map((filter) => (
              <MenuItem
                key={filter.label}
                selected={vm.status === filter.value}
                onClick={() => {
                  vm.setStatus(filter.value);
                  setFilterAnchor(null);
                }}
              >
                {filter.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
        {vm.error && (
          <ToastAlert severity="error" sx={{ mb: 2 }}>
            {vm.error}
          </ToastAlert>
        )}
        {vm.orders.length ? (
          <Box sx={{ overflowX: "auto", contain: "inline-size" }}>
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                alignContent: "start",
                minWidth: 1060,
              }}
            >
              <OrderListHeadings />
              {vm.orders.map((order) => (
                <OrderCard key={order.id} order={order} readOnly />
              ))}
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              minHeight: 200,
              color: "text.secondary",
            }}
          >
            <InboxOutlined sx={{ fontSize: 44, opacity: 0.5 }} />
            <Typography>
              {vm.loading
                ? vm.searching
                  ? "Searching…"
                  : "Loading orders…"
                : vm.searching
                  ? "No orders match your search."
                  : vm.status
                    ? "No orders with this status."
                    : "No orders yet."}
            </Typography>
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mt: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Showing {from}–{to} of {vm.total} orders
          </Typography>
          {vm.totalPages > 1 && (
            <Pagination
              page={vm.page}
              count={vm.totalPages}
              onChange={(_, value) => vm.setPage(value)}
              color="primary"
              variant="outlined"
              shape="rounded"
            />
          )}
        </Box>
      </CommonCard>
    </>
  );
}
