"use client";

import { Box, Typography } from "@mui/material";
import ChatBubbleOutlineOutlined from "@mui/icons-material/ChatBubbleOutlineOutlined";
import StarRounded from "@mui/icons-material/StarRounded";
import AccessTime from "@mui/icons-material/AccessTime";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CustomerAvatar } from "../components/CustomerAvatar";
import { CustomerStatCard } from "../components/CustomerStatCard";
import {
  CustomerToolbar,
  type FilterOption,
} from "../components/CustomerToolbar";
import { ListFooter } from "../components/ListFooter";
import { RatingStars } from "../components/RatingValue";
import { ReviewItems } from "../components/ReviewItems";
import {
  useCustomerFeedbackViewModel,
  type ReviewFilter,
} from "../viewmodels/useCustomerFeedbackViewModel";

const filters: FilterOption<ReviewFilter>[] = [
  { value: "rating", label: "Rating", icon: <StarRounded fontSize="small" /> },
  { value: "latest", label: "Latest", icon: <AccessTime fontSize="small" /> },
  {
    value: "low",
    label: "Low rating",
    icon: <ArrowDownward fontSize="small" />,
  },
];

function Labelled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{children}</Typography>
    </div>
  );
}

/** Ratings and reviews left by customers. */
export function CustomerFeedbackView() {
  const vm = useCustomerFeedbackViewModel();

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Customer feedback"
        subtitle="What customers said about their orders."
      />
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          mb: 3,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(2, 240px)",
          },
        }}
      >
        <CustomerStatCard
          icon={<ChatBubbleOutlineOutlined />}
          label="Total reviews"
          hint="Reviews customers have left for you."
          value={vm.total}
        />
        <CustomerStatCard
          icon={<StarRounded />}
          label="Average rating"
          hint="Average star rating across all reviews."
          value={vm.average === null ? "–" : vm.average.toFixed(1)}
        />
      </Box>
      <CustomerToolbar
        search={vm.search}
        onSearch={vm.setSearch}
        placeholder="Search by customer name or order ID..."
        range={vm.range}
        onRange={vm.setRange}
        filter={vm.filter}
        onFilter={vm.setFilter}
        filters={filters}
      />
      <Box sx={{ display: "grid", gap: 1.5, mt: 2.5 }}>
        {vm.rows.map((r) => {
          return (
            <Box
              key={r.id}
              sx={{
                display: "grid",
                alignItems: "center",
                gap: { xs: 1.5, lg: 2.5 },
                p: 2,
                borderRadius: "14px",
                border: 1,
                borderColor: "divider",
                gridTemplateColumns: {
                  xs: "repeat(2, minmax(0, 1fr))",
                  lg: "minmax(170px, 1.2fr) 150px minmax(130px, 1fr) minmax(200px, 2fr) 190px",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  gridColumn: { xs: "1 / -1", lg: "auto" },
                }}
              >
                <CustomerAvatar name={r.name} photo={r.photo} />
                <Typography sx={{ fontWeight: 600 }}>{r.name}</Typography>
              </Box>
              <Labelled label="Order ID">{r.orderId}</Labelled>
              <div>
                <Typography variant="body2" color="text.secondary">
                  Ordered items
                </Typography>
                <ReviewItems orderId={r.orderId} items={r.items} />
              </div>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ gridColumn: { xs: "1 / -1", lg: "auto" } }}
              >
                {r.comment}
              </Typography>
              <div>
                <RatingStars rating={r.rating} />
                <Typography variant="body2" color="text.secondary">
                  {r.date}
                </Typography>
              </div>
            </Box>
          );
        })}
        {vm.rows.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
            {vm.loading
              ? "Loading reviews…"
              : vm.error ||
                (vm.total
                  ? "No reviews match your search."
                  : "No reviews yet.")}
          </Typography>
        )}
      </Box>
      <ListFooter
        page={vm.page}
        total={vm.shown.length}
        noun="reviews"
        onPage={vm.setPage}
      />
    </>
  );
}
