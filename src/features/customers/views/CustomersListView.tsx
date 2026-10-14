"use client";
import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import PeopleAltOutlined from "@mui/icons-material/PeopleAltOutlined";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { DEMO_MODE } from "@/core/constants/config";
import { formatRupees } from "@/shared/utils/format";
import { errorMessage } from "@/shared/utils/errors";
import { ordersAuthProblem } from "@/features/dashboard/services/orderService";
import { getCustomers, type Customer } from "../services/customerService";
export function CustomersListView() {
  const [customers, setCustomers] = useState<Customer[]>([]),
    [loading, setLoading] = useState(!DEMO_MODE),
    [error, setError] = useState("");
  useEffect(() => {
    if (DEMO_MODE) return;
    let active = true;
    getCustomers()
      .then((list) => active && setCustomers(list))
      .catch(async (e) => {
        const problem = await ordersAuthProblem(e);
        if (active)
          setError(
            problem === "not-allowed"
              ? "Customer details are not available for this restaurant account yet."
              : errorMessage(e),
          );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);
  return (
    <>
      <PageHeader
        eyebrow="Customers / Customers list"
        title="Customers"
        subtitle="Customers who have ordered from your restaurant."
      />
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <CommonCard>
        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress aria-label="Loading customers" />
          </Box>
        ) : customers.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              minHeight: 200,
              color: "text.secondary",
              textAlign: "center",
            }}
          >
            <PeopleAltOutlined sx={{ fontSize: 44, opacity: 0.5 }} />
            <Typography>
              {DEMO_MODE
                ? "Customers appear here when the portal is connected to the server."
                : "No customers yet."}
            </Typography>
          </Box>
        ) : (
          customers.map((customer) => (
            <div className="review-row" key={customer.id}>
              <Box className="grow" sx={{ minWidth: 0 }}>
                <strong>{customer.name ?? "Customer"}</strong>
                <small>
                  {[
                    customer.phone && `Mobile ${customer.phone}`,
                    customer.pnrs.length && `PNR ${customer.pnrs.join(", ")}`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No contact details shared"}
                </small>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <strong>{formatRupees(customer.spent)}</strong>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  {customer.orders} {customer.orders === 1 ? "order" : "orders"}
                  {customer.lastOrderAt
                    ? ` · last ${new Date(customer.lastOrderAt).toLocaleDateString()}`
                    : ""}
                </Typography>
              </Box>
            </div>
          ))
        )}
      </CommonCard>
    </>
  );
}
