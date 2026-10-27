"use client";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import ConstructionOutlined from "@mui/icons-material/ConstructionOutlined";
import type { NavPage, NavSection } from "@/core/constants/navigation";
import { API_PATHS, DEMO_MODE } from "@/core/constants/config";
import { CommonButton } from "@/shared/components/actions/CommonButton";
import { CommonCard } from "@/shared/components/layout/CommonCard";
import { PageHeader } from "@/shared/components/layout/PageHeader";
import { LiveOrders } from "@/features/dashboard/components/LiveOrders";
/** Shell for a page whose screen or API is not connected yet. */
export function SectionView({
  section,
  page,
}: {
  section: NavSection;
  page: NavPage;
}) {
  const router = useRouter();
  return (
    <>
      <PageHeader
        eyebrow={section.label}
        title={page.label}
        subtitle={page.description}
      />
      {page.href === "/orders/live" && (DEMO_MODE || API_PATHS.orders) ? (
        <LiveOrders />
      ) : (
        <CommonCard>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 1.5,
              py: 6,
            }}
          >
            <ConstructionOutlined color="disabled" sx={{ fontSize: 48 }} />
            <Typography variant="h6">
              {page.label} is coming soon
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
              We are still building this. Check back soon.
            </Typography>
            <CommonButton
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={() => router.push("/dashboard")}
            >
              Back to dashboard
            </CommonButton>
          </Box>
        </CommonCard>
      )}
    </>
  );
}
