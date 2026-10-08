import type { ReactElement } from "react";
import SpaceDashboardOutlined from "@mui/icons-material/SpaceDashboardOutlined";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import PeopleAltOutlined from "@mui/icons-material/PeopleAltOutlined";
import InsertChartOutlined from "@mui/icons-material/InsertChartOutlined";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import type { NavSectionId } from "@/core/constants/navigation";
// Icons live here, not in the navigation constants, so server pages can
// import those constants and pass them to client views as plain data.
export const navIcons: Record<NavSectionId, ReactElement> = {
  dashboard: <SpaceDashboardOutlined fontSize="small" />,
  orders: <ReceiptLongOutlined fontSize="small" />,
  menu: <RestaurantMenuOutlined fontSize="small" />,
  customers: <PeopleAltOutlined fontSize="small" />,
  reports: <InsertChartOutlined fontSize="small" />,
  payments: <AccountBalanceWalletOutlined fontSize="small" />,
  offers: <LocalOfferOutlined fontSize="small" />,
  settings: <SettingsOutlined fontSize="small" />,
};
