const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
/** 18420 → "₹18,420" (Indian digit grouping). */
export const formatRupees = (amount: number) => rupees.format(amount);
