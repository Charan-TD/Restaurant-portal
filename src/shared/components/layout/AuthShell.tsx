import type { ReactNode } from "react";
import Image from "next/image";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import RestaurantMenuOutlined from "@mui/icons-material/RestaurantMenuOutlined";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
const highlights = [
  {
    icon: <ReceiptLongOutlined fontSize="small" />,
    title: "Live train orders",
    text: "Accept orders and mark them ready before the train pulls in.",
  },
  {
    icon: <RestaurantMenuOutlined fontSize="small" />,
    title: "Your menu, your hours",
    text: "Update dishes, prices and opening times whenever you need to.",
  },
  {
    icon: <AccountBalanceWalletOutlined fontSize="small" />,
    title: "Clear payouts",
    text: "Track revenue and settlements in one place.",
  },
];
const stations = ["Order placed", "Preparing", "Handed over"];
/** Split screen for login and similar pages: brand panel left, form right. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="auth-split">
      <aside className="auth-hero">
        <div className="auth-hero-brand">
          <Image
            src="/logo.jpg"
            alt="Train Dhaba logo"
            width={44}
            height={44}
            className="brand-logo"
            priority
          />
          <div>
            <strong>Train Dhaba</strong>
            <span>Restaurant partner</span>
          </div>
        </div>
        <div className="auth-hero-body">
          <span className="auth-eyebrow">Train Dhaba · Partner portal</span>
          <h2 className="auth-title">
            Fresh food,
            <br />
            delivered to the coach.
          </h2>
          <p>
            Sign in to run your kitchen on Train Dhaba: orders, menu and
            payouts, all from one dashboard.
          </p>
          <ul className="auth-highlights">
            {highlights.map((item) => (
              <li key={item.title}>
                <span className="auth-highlight-icon">{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <ol className="auth-track" aria-label="How an order moves">
          {stations.map((station) => (
            <li key={station}>{station}</li>
          ))}
        </ol>
      </aside>
      <main className="auth-panel">{children}</main>
    </div>
  );
}
