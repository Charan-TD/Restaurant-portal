/**
 * DESIGN ONLY: complaints raised by passengers and handled with TrainDhaba
 * support. The backend has no complaints API yet, so `complaintsSample` stands
 * in for it; replace it with the API's list (same shape) when it exists.
 */
export type ComplaintStatus = "needs" | "review" | "resolved";

export interface Complaint {
  /** "C-2041". */
  id: string;
  title: string;
  status: ComplaintStatus;
  /** "48207": the order number as shown. */
  order: string;
  orderAmount: number;
  payment: "Prepaid" | "COD";
  passenger: string;
  train: string;
  seat: string;
  rider: string;
  pickedUp: string;
  handedOver: string;
  handedOverNote: string;
  /** What the passenger wrote. */
  message: string;
  /** When it was raised, as shown: "Today, 3:20 PM". */
  raised: string;
  /** The refund the passenger asked for. */
  asked: { label: string; amount: number };
  /** Needs a response: the time it is due, as shown ("6:20 PM today"). */
  respondBy?: string;
  /** What the restaurant answered, once it has. */
  response?: string;
  /** How it ended (resolved): "₹240 refunded to passenger · taken from 18 Nov payout". */
  outcome?: { text: string; good: boolean };
}

export const statusLabel: Record<ComplaintStatus, string> = {
  needs: "NEEDS YOUR RESPONSE",
  review: "IN REVIEW",
  resolved: "RESOLVED",
};

export const complaintsSample: Complaint[] = [
  {
    id: "C-2041",
    title: "Late delivery",
    status: "needs",
    order: "48207",
    orderAmount: 460,
    payment: "Prepaid",
    passenger: "Vikram S",
    train: "16021 Kaveri Exp",
    seat: "S6 41",
    rider: "Ravi Kumar",
    pickedUp: "Picked up 2:52 PM",
    handedOver: "3:14 PM",
    handedOverNote: "Train left YPR 3:16 PM",
    message: "Food reached when the train was about to leave. Paneer was cold by the time I opened it.",
    raised: "Today, 3:20 PM",
    asked: { label: "Full refund", amount: 460 },
    respondBy: "6:20 PM today",
  },
  {
    id: "C-2039",
    title: "Missing item",
    status: "needs",
    order: "48201",
    orderAmount: 380,
    payment: "COD",
    passenger: "Rohit P",
    train: "22691 Rajdhani",
    seat: "B4 22",
    rider: "Manoj K",
    pickedUp: "Picked up 12:40 PM",
    handedOver: "1:02 PM",
    handedOverNote: "Train left SBC 1:10 PM",
    message: "Raita was not in the packet.",
    raised: "Today, 1:05 PM",
    asked: { label: "Refund for the item", amount: 40 },
    respondBy: "4:05 PM today",
  },
  {
    id: "C-2035",
    title: "Food quality",
    status: "review",
    order: "48188",
    orderAmount: 320,
    payment: "Prepaid",
    passenger: "Sneha M",
    train: "12007 Shatabdi",
    seat: "C1 16",
    rider: "Suresh",
    pickedUp: "Picked up 6:50 PM",
    handedOver: "7:12 PM",
    handedOverNote: "Train left SBC 7:20 PM",
    message: "Biryani rice was dry and hard.",
    raised: "Yesterday",
    asked: { label: "Full refund", amount: 320 },
    response: "The biryani was cooked fresh at 6:30 PM and packed hot.",
    outcome: { text: "You responded · TrainDhaba support is checking", good: true },
  },
  {
    id: "C-2031",
    title: "Wrong item",
    status: "resolved",
    order: "48172",
    orderAmount: 240,
    payment: "Prepaid",
    passenger: "Kiran T",
    train: "12627 Karnataka Exp",
    seat: "B2 40",
    rider: "Imran",
    pickedUp: "Picked up 1:10 PM",
    handedOver: "1:32 PM",
    handedOverNote: "Train left BNC 1:40 PM",
    message: "Got veg thali instead of egg biryani.",
    raised: "17 Nov",
    asked: { label: "Full refund", amount: 240 },
    outcome: { text: "₹240 refunded to passenger · taken from 18 Nov payout", good: false },
  },
  {
    id: "C-2027",
    title: "Late delivery",
    status: "resolved",
    order: "48150",
    orderAmount: 180,
    payment: "COD",
    passenger: "Arun V",
    train: "11301 Udyan Exp",
    seat: "S2 8",
    rider: "Ravi Kumar",
    pickedUp: "Picked up 9:05 AM",
    handedOver: "9:30 AM",
    handedOverNote: "Train left BNC 9:38 AM",
    message: "Delivery was 10 minutes late.",
    raised: "15 Nov",
    asked: { label: "Partial refund", amount: 90 },
    outcome: { text: "Closed · train arrived early, no refund taken", good: true },
  },
];
