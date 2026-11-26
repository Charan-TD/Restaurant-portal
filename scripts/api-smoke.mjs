// Read-only smoke test of the restaurant APIs the portal uses.
//   TD_EMAIL=... TD_PASSWORD=... node scripts/api-smoke.mjs      (logs in)
//   TD_TOKEN=<access token> node scripts/api-smoke.mjs            (or reuse a token)
// Only GET requests are sent: nothing here changes data. Without a login it just
// checks that each route exists (401 = exists, 404 = missing).
const BASE = (process.env.TD_API ?? "https://train-dhaba-backend-dev.up.railway.app").replace(/\/+$/, "");
const P = "/api/v1/restaurant";
const routes = [
  "/profile", "/orders?limit=5", "/orders/group-orders", "/orders/search?q=ORD", "/orders/customers",
  "/riders", "/reviews", "/reviews/metrics", "/complaints", "/complaints/metrics", "/offers",
  "/payments/summary", "/payments/breakdown", "/payments/history", "/recommended-menu",
  "/insights/metrics", "/insights/orders", "/insights/earnings-details", "/insights/settlement-breakdown",
  "/insights/payment-distribution", "/insights/undelivered", "/insights/total-sale-value", "/insights/cod", "/insights/prepaid",
];
let token = process.env.TD_TOKEN;
if (!token && process.env.TD_EMAIL) {
  const r = await fetch(`${BASE}/api/v1/auth/restaurant/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.TD_EMAIL, password: process.env.TD_PASSWORD }),
  });
  const j = await r.json().catch(() => ({}));
  token = j.data?.access_token ?? j.data?.token ?? j.access_token ?? j.token;
  console.log(`login → ${r.status}${token ? "" : " (no token: " + (j.message ?? "?") + ")"}`);
}
for (const path of routes) {
  const r = await fetch(BASE + P + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  const j = await r.json().catch(() => null);
  const shape = j?.data && typeof j.data === "object" ? Object.keys(j.data).slice(0, 6).join(",") : "";
  console.log(`${String(r.status).padEnd(4)}${path.padEnd(34)}${r.ok ? shape : (j?.message ?? "")}`);
}
