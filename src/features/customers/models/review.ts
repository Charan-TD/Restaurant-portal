export interface ReviewItem {
  name: string;
  quantity: number;
}

export interface ReviewRow {
  /** One order can be reviewed once, so the order number identifies a review. */
  id: string;
  name: string;
  /** Signed picture URL; the avatar shows the first letter when there is none. */
  photo?: string;
  orderId: string;
  /** Every item in the order. */
  items: ReviewItem[];
  rating: number;
  /** Shown as written, e.g. "12 Apr 2024, 2:15 PM". */
  date: string;
  /** Used to sort by latest. */
  at: string;
  comment: string;
}

export const itemLabel = ({ name, quantity }: ReviewItem) =>
  quantity > 1 ? `${quantity} × ${name}` : name;
