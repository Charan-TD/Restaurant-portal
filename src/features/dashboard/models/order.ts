export type OrderStatus = "New" | "Accepted" | "Rejected" | "Ready";
export interface Order {
  id: string;
  food: string;
  station: string;
  amount: number;
  state: OrderStatus;
}
