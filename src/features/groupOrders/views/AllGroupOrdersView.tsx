"use client";
import { useState } from "react";
import FilterListOutlined from "@mui/icons-material/FilterListOutlined";
import InboxOutlined from "@mui/icons-material/InboxOutlined";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import {
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";
import { ToastAlert } from "@/core/providers/ToastProvider";
import { ListFooter, PAGE_SIZE } from "@/features/customers/components/ListFooter";
import { CommonTextField } from "@/shared/components/form/CommonTextField";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import {
  GroupOrderCard,
  GroupOrderHeadings,
} from "../components/GroupOrderCard";
import { useGroupOrdersViewModel } from "../viewmodels/useGroupOrdersViewModel";
/** A filter's value is the order status it shows; undefined shows every order. */
type Filter = string | undefined;
// The same filters as the all orders screen.
const filters: { label: string; value: Filter }[] = [
  { label: "All orders", value: undefined },
  { label: "Preparing", value: "PREPARING" },
  { label: "Delivered", value: "DELIVERED" },
];
const moreFilters: { label: string; value: Filter }[] = [
  { label: "New", value: "ASSIGNED" },
  { label: "Ready", value: "READY" },
  { label: "Out for delivery", value: "OUT_FOR_DELIVERY" },
  { label: "Cancelled", value: "REJECTED" },
  { label: "Failed", value: "FAILED" },
];
/** Every group order the admin has assigned to this restaurant, in any status. */
export function AllGroupOrdersView() {
  const vm = useGroupOrdersViewModel(),
    [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null),
    [status, setStatus] = useState<Filter>(undefined),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    term = search.trim().toLowerCase(),
    // The React Compiler memoizes this.
    matching = vm.orders.filter(
      (o) =>
        !term ||
        [o.contactName, o.mobile, o.email, o.details, o.id].some((field) =>
          field?.toLowerCase().includes(term),
        ),
    ),
    countOf = (value: Filter) =>
      value ? matching.filter((o) => o.status === value).length : matching.length,
    shown = status ? matching.filter((o) => o.status === status) : matching,
    lastPage = Math.max(1, Math.ceil(shown.length / PAGE_SIZE)),
    current = Math.min(page, lastPage),
    rows = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    extra = moreFilters.find((f) => f.value === status),
    select = (value: Filter) => {
      setStatus(value);
      setPage(1);
    };
  return (
    <>
      <PageHeader
        eyebrow="Group orders"
        title="All group orders"
        subtitle="Every group order assigned to you, including delivered and cancelled ones."
      />
      <CommonCard>
        <CommonTextField
          size="small"
          fullWidth
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by contact, mobile, email or order details…"
          slotProps={{
            htmlInput: { "aria-label": "Search group orders", maxLength: 100 },
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
            <Chip
              key={f.label}
              label={`${f.label} (${countOf(f.value)})`}
              clickable
              color={status === f.value ? "primary" : "default"}
              variant={status === f.value ? "filled" : "outlined"}
              onClick={() => select(f.value)}
            />
          ))}
          <Tooltip title="More order filters">
            <IconButton
              aria-label="More order filters"
              aria-haspopup="menu"
              aria-expanded={Boolean(filterAnchor)}
              onClick={(event) => setFilterAnchor(event.currentTarget)}
              color={extra ? "primary" : "default"}
            >
              <FilterListOutlined />
            </IconButton>
          </Tooltip>
          {extra && (
            <Chip
              label={`${extra.label} (${countOf(extra.value)})`}
              color="primary"
              onDelete={() => select(undefined)}
            />
          )}
          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
          >
            {moreFilters.map((f) => (
              <MenuItem
                key={f.label}
                selected={status === f.value}
                onClick={() => {
                  select(f.value);
                  setFilterAnchor(null);
                }}
              >
                {`${f.label} (${countOf(f.value)})`}
              </MenuItem>
            ))}
          </Menu>
        </Box>
        {vm.error && (
          <ToastAlert severity="error" sx={{ mb: 2 }}>
            {vm.error}
          </ToastAlert>
        )}
        {rows.length ? (
          <Box sx={{ overflowX: "auto", contain: "inline-size" }}>
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                alignContent: "start",
                minWidth: 900,
              }}
            >
              <GroupOrderHeadings />
              {rows.map((order) => (
                <GroupOrderCard key={order.key} order={order} readOnly />
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
                ? "Loading group orders…"
                : term
                  ? "No group orders match your search."
                  : status
                    ? "No group orders with this status."
                    : "No group orders yet."}
            </Typography>
          </Box>
        )}
        <ListFooter
          page={current}
          total={shown.length}
          noun="group orders"
          onPage={setPage}
        />
      </CommonCard>
    </>
  );
}
