import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/features/payments/models/payments.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { toSummary, toBreakdown, toPayoutPage, toPayout, breakdownLabel } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);

test("the summary reads money sent as strings", () => {
  const s = toSummary({ success: true, data: { available_for_payout: "5710.00", wallet_balance: "2500.00", last_payout_at: "2026-11-01T12:00:00Z" } });
  assert.equal(s.availableForPayout, 5710);
  assert.equal(s.walletBalance, 2500);
  assert.equal(s.lastPayoutAt, "2026-11-01T12:00:00Z");
  assert.equal(s.outstandingDues, 0);
});

test("an empty or odd answer reads as zeros, never NaN", () => {
  assert.equal(toSummary(undefined).walletBalance, 0);
  assert.equal(toBreakdown({ data: { net_amount: "abc" } }).net, 0);
});

test("the breakdown maps the cod fee lines", () => {
  const b = toBreakdown({ data: { order_earnings: "10000.00", cod_fee_percentage: 42.9, cod_fee_deductions: "4290.00", net_amount: "5710.00" } });
  assert.equal(b.codFeePercent, 42.9);
  assert.equal(b.codFeeDeductions, 4290);
  assert.equal(b.net, 5710);
});

test("the history page reads payouts and pagination", () => {
  const page = toPayoutPage({ data: { payouts: [{ id: "a", payout_type: "EMERGENCY", status: "PENDING", net_amount: "10" }, { id: "b", payout_type: "REGULAR", status: "weird" }], pagination: { current_page: 2, total_pages: 3, total_records: 41 } } });
  assert.equal(page.payouts.length, 2);
  assert.equal(page.payouts[0].type, "EMERGENCY");
  assert.equal(page.payouts[1].status, "PENDING");
  assert.deepEqual([page.page, page.pages, page.total], [2, 3, 41]);
});

test("a single payout keeps its breakdown and rejection reason", () => {
  const p = toPayout({ id: "x", status: "REJECTED", rejection_reason: "Docs", breakdown: { order_earnings: "100.00", cod_fee_deductions: "40.00", note: {} } });
  assert.equal(p.rejectionReason, "Docs");
  assert.deepEqual(p.breakdown, [{ key: "order_earnings", amount: 100 }, { key: "cod_fee_deductions", amount: 40 }]);
  assert.equal(breakdownLabel("cod_fee_deductions"), "Cod fee deductions");
});

test("a month becomes its first and last day", async () => {
  const { monthRange } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
  assert.deepEqual(monthRange("2026-10"), { fromDate: "2026-10-01", toDate: "2026-10-31" });
  assert.equal(monthRange("2028-02").toDate, "2028-02-29");
  assert.equal(monthRange(""), undefined);
});
