/** Where a restaurant's reply to a review stands: replies go through admin approval. */
export type ReplyStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export interface ReviewReply {
  id: string;
  text: string;
  status: ReplyStatus;
  /** 1 for the first reply, one more for each resubmission. */
  attempt: number;
  /** Why the admin rejected it, so it can be rewritten. */
  rejectionReason?: string;
  /** Only a rejected reply can be edited and sent again. */
  canEdit: boolean;
  submittedAt?: string;
}

export interface ReviewRow {
  /** The server's review UUID; replies are posted to it. */
  id: string;
  name: string;
  /** "ORD-R7K2-583921". */
  orderId: string;
  rating: number;
  comment: string;
  /** ISO time the review was written. */
  at: string;
  reply?: ReviewReply;
}

export interface ReviewPage {
  rows: ReviewRow[];
  page: number;
  pages: number;
  total: number;
}

export type ReplyFilter = "NOT_REPLIED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
export type ReviewSort = "newest" | "oldest" | "highest_rating" | "lowest_rating";
