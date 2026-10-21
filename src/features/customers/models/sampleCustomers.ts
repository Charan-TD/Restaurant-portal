/** Static demo data: shows how customers and their reviews will be presented. */
export interface CustomerRow {
  id: string;
  name: string;
  /** Already masked, e.g. "98****1234". */
  phone: string;
  orderId: string;
  /** Total orders placed with this restaurant. */
  orders: number;
  spent: number;
  items: string[];
  rating: number;
}

export type Sentiment = "Positive" | "Neutral" | "Low rating";

export interface ReviewRow {
  id: string;
  name: string;
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

export const sampleCustomers: CustomerRow[] = [
  {
    id: "c1",
    name: "Neha Sharma",
    phone: "98****1234",
    orderId: "#TD72841",
    orders: 12,
    spent: 320,
    items: ["Chicken Biryani", "Raita", "Gulab Jamun"],
    rating: 4.9,
  },
  {
    id: "c2",
    name: "Rahul Verma",
    phone: "90****5678",
    orderId: "#TD72840",
    orders: 8,
    spent: 280,
    items: ["Paneer Butter Masala", "Naan", "Jeera Rice", "Papad"],
    rating: 4.8,
  },
  {
    id: "c3",
    name: "Ananya Iyer",
    phone: "97****4321",
    orderId: "#TD72839",
    orders: 5,
    spent: 220,
    items: ["Veg Biryani", "Raita"],
    rating: 4.7,
  },
  {
    id: "c4",
    name: "Suresh Kumar",
    phone: "93****8765",
    orderId: "#TD72838",
    orders: 3,
    spent: 340,
    items: ["Chicken Biryani", "Chicken 65", "Soft Drink"],
    rating: 4.9,
  },
  {
    id: "c5",
    name: "Priya Mehta",
    phone: "91****1098",
    orderId: "#TD72837",
    orders: 2,
    spent: 180,
    items: ["Dosa", "Chutney", "Filter Coffee"],
    rating: 4.6,
  },
  {
    id: "c6",
    name: "Imran Khan",
    phone: "99****3456",
    orderId: "#TD72836",
    orders: 9,
    spent: 450,
    items: ["Mutton Biryani"],
    rating: 4.5,
  },
  {
    id: "c7",
    name: "Anita Rao",
    phone: "88****7788",
    orderId: "#TD72835",
    orders: 4,
    spent: 260,
    items: ["Veg Biryani", "Gulab Jamun"],
    rating: 4.4,
  },
  {
    id: "c8",
    name: "Vikram Singh",
    phone: "96****2211",
    orderId: "#TD72834",
    orders: 15,
    spent: 610,
    items: ["Butter Chicken", "Naan", "Jeera Rice", "Lassi"],
    rating: 4.8,
  },
  {
    id: "c9",
    name: "Kavya Nair",
    phone: "94****6655",
    orderId: "#TD72833",
    orders: 1,
    spent: 150,
    items: ["Egg Fried Rice"],
    rating: 4.2,
  },
  {
    id: "c10",
    name: "Arjun Reddy",
    phone: "95****9090",
    orderId: "#TD72832",
    orders: 6,
    spent: 390,
    items: ["Chicken Biryani", "Raita"],
    rating: 4.7,
  },
  {
    id: "c11",
    name: "Meera Joshi",
    phone: "92****4545",
    orderId: "#TD72831",
    orders: 2,
    spent: 200,
    items: ["Masala Dosa", "Idli", "Vada"],
    rating: 4.3,
  },
  {
    id: "c12",
    name: "Rohan Gupta",
    phone: "98****1212",
    orderId: "#TD72830",
    orders: 7,
    spent: 520,
    items: ["Paneer Tikka", "Dal Makhani", "Naan"],
    rating: 4.6,
  },
];

export const sampleReviews: ReviewRow[] = [
  {
    id: "r1",
    name: "Neha Sharma",
    phone: "98****1234",
    orderId: "#TD72841",
    item: "Chicken Biryani",
    rating: 4.9,
    date: "12 Apr 2024, 2:15 PM",
    at: "2024-04-12T14:15",
    comment:
      "Amazing taste! Biryani was fresh, flavourful and perfectly packed. Really enjoyed it.",
  },
  {
    id: "r2",
    name: "Rahul Verma",
    phone: "90****5678",
    orderId: "#TD72840",
    item: "Paneer Butter Masala",
    rating: 4.0,
    date: "11 Apr 2024, 8:40 PM",
    at: "2024-04-11T20:40",
    comment:
      "Good taste and quality. Paneer was soft and gravy was nice. Packaging can be better.",
  },
  {
    id: "r3",
    name: "Ananya Iyer",
    phone: "97****4321",
    orderId: "#TD72839",
    item: "Veg Biryani",
    rating: 5.0,
    date: "10 Apr 2024, 1:20 PM",
    at: "2024-04-10T13:20",
    comment:
      "Loved the spice and aroma. One of the best veg biryani's I've had on train!",
  },
  {
    id: "r4",
    name: "Suresh Kumar",
    phone: "93****8765",
    orderId: "#TD72838",
    item: "Dosa",
    rating: 3.0,
    date: "09 Apr 2024, 11:05 AM",
    at: "2024-04-09T11:05",
    comment:
      "Dosa was good but a bit cold when it arrived. Chutney could be more flavourful.",
  },
  {
    id: "r5",
    name: "Priya Mehta",
    phone: "91****1098",
    orderId: "#TD72837",
    item: "Raita",
    rating: 4.0,
    date: "08 Apr 2024, 6:30 PM",
    at: "2024-04-08T18:30",
    comment: "Fresh and tasty raita. Good portion size and nicely packed.",
  },
  {
    id: "r6",
    name: "Imran Khan",
    phone: "99****3456",
    orderId: "#TD72836",
    item: "Mutton Biryani",
    rating: 4.8,
    date: "07 Apr 2024, 9:10 PM",
    at: "2024-04-07T21:10",
    comment:
      "Mutton was tender and well cooked. Delivered right on time at my seat.",
  },
  {
    id: "r7",
    name: "Anita Rao",
    phone: "88****7788",
    orderId: "#TD72835",
    item: "Gulab Jamun",
    rating: 2.5,
    date: "06 Apr 2024, 3:45 PM",
    at: "2024-04-06T15:45",
    comment: "Too sweet and the pack was leaking. Expected better.",
  },
  {
    id: "r8",
    name: "Vikram Singh",
    phone: "96****2211",
    orderId: "#TD72834",
    item: "Butter Chicken",
    rating: 4.7,
    date: "05 Apr 2024, 7:55 PM",
    at: "2024-04-05T19:55",
    comment: "Rich and creamy gravy. Naan stayed soft. Will order again.",
  },
  {
    id: "r9",
    name: "Kavya Nair",
    phone: "94****6655",
    orderId: "#TD72833",
    item: "Egg Fried Rice",
    rating: 3.5,
    date: "04 Apr 2024, 12:30 PM",
    at: "2024-04-04T12:30",
    comment: "Decent taste, but portion was a little small for the price.",
  },
  {
    id: "r10",
    name: "Arjun Reddy",
    phone: "95****9090",
    orderId: "#TD72832",
    item: "Chicken Biryani",
    rating: 4.5,
    date: "03 Apr 2024, 8:20 PM",
    at: "2024-04-03T20:20",
    comment: "Spicy and flavourful, just the way I like it. Good quantity.",
  },
];
