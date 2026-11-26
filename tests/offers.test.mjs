import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
// Compile only the pure offer model, as insights.test.mjs does for its parser.
const source = await readFile(new URL("../src/features/offers/models/offer.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { toOfferPayload, offerToForm, offerProblem, emptyOfferForm } = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);

const form = (patch) => ({
  ...emptyOfferForm(),
  startDate: "2026-12-01",
  endDate: "2026-12-15",
  ...patch,
});

test("a flat offer is sent as FIXED with its rupees and no free item", () => {
  const p = toOfferPayload(form({ type: "Flat ₹ off", value: "50", minOrder: "299" }));
  assert.equal(p.discount_type, "FIXED");
  assert.equal(p.discount_value, 50);
  assert.equal(p.free_item_name, null);
  assert.equal(p.min_order_amount, 299);
  assert.equal(p.valid_from, "2026-12-01");
  assert.equal(p.customer_type, "ALL");
});

test("a free item offer carries the name and a null discount value", () => {
  const p = toOfferPayload(form({ type: "Free item", value: " Cool Drink ", customer: "First-time customer" }));
  assert.equal(p.discount_type, "FREE_ITEM");
  assert.equal(p.discount_value, null);
  assert.equal(p.free_item_name, "Cool Drink");
  assert.equal(p.customer_type, "FIRST_TIME");
});

test("an offer from the server fills the form: IST date part and HH:mm times", () => {
  const f = offerToForm({
    discount_type: "PERCENTAGE",
    discount_value: 15,
    min_order_amount: 200,
    starts_at: "2026-12-01T00:00:00+05:30",
    expires_at: "2026-12-15T23:59:59.999+05:30",
    daily_start_time: "11:00:00",
    daily_end_time: "15:00:00",
    customer_type: "ALL",
  });
  assert.equal(f.type, "% off");
  assert.equal(f.value, "15");
  assert.equal(f.startDate, "2026-12-01");
  assert.equal(f.endDate, "2026-12-15");
  assert.equal(f.startTime, "11:00");
  assert.equal(f.endTime, "15:00");
});

test("the form is checked before it is sent", () => {
  assert.match(offerProblem(form({ value: "" })), /discount/i);
  assert.match(offerProblem(form({ type: "% off", value: "120" })), /between 1 and 100/);
  assert.match(offerProblem(form({ value: "50", startDate: "", endDate: "" })), /starts and ends/);
  assert.match(offerProblem(form({ value: "50", startDate: "2026-12-10", endDate: "2026-12-01" })), /before/);
  assert.equal(offerProblem(form({ value: "50" })), "");
});
