export type Sentiment = "Positive" | "Neutral" | "Low rating";

export interface ReviewRow {
  id: string;
  name: string;
  /** Already masked, e.g. "98****1234". */
  phone: string;
  orderId: string;
  item: string;
  rating: number;
  /** Shown as written, e.g. "12 Apr 2024, 2:15 PM". */
  date: string;
  /** Used to sort by latest. */
  at: string;
  comment: string;
}

export const sentimentOf = (rating: number): Sentiment =>
  rating >= 4.5 ? "Positive" : rating >= 3.5 ? "Neutral" : "Low rating";
