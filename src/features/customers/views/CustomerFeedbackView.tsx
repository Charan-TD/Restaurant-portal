"use client";

import { useMemo, useState } from "react";
import { Box, Chip, IconButton, Typography } from "@mui/material";
import MoreVert from "@mui/icons-material/MoreVert";
import ChatBubbleOutlineOutlined from "@mui/icons-material/ChatBubbleOutlineOutlined";
import StarRounded from "@mui/icons-material/StarRounded";
import ThumbUp from "@mui/icons-material/ThumbUp";
import AccessTime from "@mui/icons-material/AccessTime";
import ArrowDownward from "@mui/icons-material/ArrowDownward";
import RestaurantOutlined from "@mui/icons-material/RestaurantOutlined";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { CustomerAvatar } from "../components/CustomerAvatar";
import { CustomerStatCard } from "../components/CustomerStatCard";
import {
  CustomerToolbar,
  type DateRange,
  type FilterOption,
} from "../components/CustomerToolbar";
import { ListFooter, PAGE_SIZE } from "../components/ListFooter";
import { RatingStars } from "../components/RatingValue";
import {
  sampleReviews,
  sentimentOf,
  type ReviewRow,
  type Sentiment,
} from "../models/sampleCustomers";

type ReviewFilter = "rating" | "latest" | "low" | "item";

const filters: FilterOption<ReviewFilter>[] = [
  { value: "rating", label: "Rating", icon: <StarRounded fontSize="small" /> },
  { value: "latest", label: "Latest", icon: <AccessTime fontSize="small" /> },
  {
    value: "low",
    label: "Low rating",
    icon: <ArrowDownward fontSize="small" />,
  },
  {
    value: "item",
    label: "Item",
    icon: <RestaurantOutlined fontSize="small" />,
  },
];

const sorters: Record<ReviewFilter, (a: ReviewRow, b: ReviewRow) => number> = {
  rating: (a, b) => b.rating - a.rating,
  latest: (a, b) => b.at.localeCompare(a.at),
  low: (a, b) => a.rating - b.rating,
  item: (a, b) => a.item.localeCompare(b.item),
};

const chipColors: Record<Sentiment, { bg: string; fg: string }> = {
  Positive: { bg: "#e6f6ec", fg: "#1f8a4c" },
  Neutral: { bg: "#eef0ee", fg: "#59625b" },
  "Low rating": { bg: "#fde8de", fg: "#d9480f" },
};

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

/** Ratings and reviews left by customers (static sample data for now). */
export function CustomerFeedbackView() {
  const [search, setSearch] = useState(""),
    [range, setRange] = useState<DateRange>("Last 30 days"),
    [filter, setFilter] = useState<ReviewFilter | null>(null),
    [page, setPage] = useState(1);

  const reviews = useMemo(() => {
    const term = search.trim().toLowerCase(),
      list = sampleReviews.filter(
        (r) =>
          !term ||
          r.name.toLowerCase().includes(term) ||
          r.orderId.toLowerCase().includes(term),
      );
    return filter ? [...list].sort(sorters[filter]) : list;
  }, [search, filter]);

  const lastPage = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE)),
    current = Math.min(page, lastPage),
    rows = reviews.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    average =
      sampleReviews.reduce((sum, r) => sum + r.rating, 0) /
      sampleReviews.length;

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="Customer feedback"
        subtitle="View ratings and reviews left by customers for your restaurant."
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
          icon={<ChatBubbleOutlineOutlined />}
          label="Total reviews"
          value={sampleReviews.length}
          change="12%"
        />
        <CustomerStatCard
          icon={<StarRounded />}
          label="Average rating"
          value={average.toFixed(1)}
          change="0.3"
          tint="#fdf3dc"
          iconColor="#e09b00"
        />
        <CustomerStatCard
          icon={<ThumbUp />}
          label="Positive reviews"
          value={
            sampleReviews.filter((r) => sentimentOf(r.rating) === "Positive")
              .length
          }
          change="15%"
          tint="#e6f6ec"
          iconColor="#1f8a4c"
        />
      </Box>
      <CommonCard>
        <CustomerToolbar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search by customer name or order ID..."
          range={range}
          onRange={setRange}
          filter={filter}
          onFilter={(value) => {
            setFilter(value);
            setPage(1);
          }}
          filters={filters}
        />
        <Box sx={{ display: "grid", gap: 1.5, mt: 2.5 }}>
          {rows.map((r) => {
            const sentiment = sentimentOf(r.rating);
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
                    lg: "minmax(170px, 1.2fr) 110px minmax(130px, 1fr) 190px minmax(200px, 2fr) 110px 40px",
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
                  <CustomerAvatar name={r.name} />
                  <div>
                    <Typography sx={{ fontWeight: 600 }}>{r.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {r.phone}
                    </Typography>
                  </div>
                </Box>
                <Labelled label="Order ID">{r.orderId}</Labelled>
                <Labelled label="Ordered item">{r.item}</Labelled>
                <div>
                  <RatingStars rating={r.rating} />
                  <Typography variant="body2" color="text.secondary">
                    {r.date}
                  </Typography>
                </div>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ gridColumn: { xs: "1 / -1", lg: "auto" } }}
                >
                  {r.comment}
                </Typography>
                <Chip
                  label={sentiment}
                  sx={{
                    justifySelf: "start",
                    fontWeight: 600,
                    bgcolor: chipColors[sentiment].bg,
                    color: chipColors[sentiment].fg,
                  }}
                />
                <IconButton
                  aria-label={`More options for ${r.name}'s review`}
                  sx={{ justifySelf: "end" }}
                >
                  <MoreVert />
                </IconButton>
              </Box>
            );
          })}
          {rows.length === 0 && (
            <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
              No reviews match your search.
            </Typography>
          )}
        </Box>
        <ListFooter
          page={current}
          total={reviews.length}
          noun="reviews"
          onPage={setPage}
        />
      </CommonCard>
    </>
  );
}
