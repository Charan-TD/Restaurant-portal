export const restaurantTypes = ["Restaurant", "Cloud kitchen"] as const;
export type RestaurantType = (typeof restaurantTypes)[number];
export const foodTypes = ["Veg", "Egg", "Non-veg"] as const;
export type FoodType = (typeof foodTypes)[number];
/** Menu items use the same veg / egg / non-veg types. */
export const itemTypes = foodTypes;
export type ItemType = FoodType;
export const COUNTRY_CODE = "+91";
export const cuisineOptions = [
  "American",
  "Andhra",
  "Arabian",
  "Asian",
  "Awadhi",
  "Bakery",
  "Bengali",
  "Beverages",
  "Biryani",
  "Burgers",
  "Chettinad",
  "Chinese",
  "Continental",
  "Desserts",
  "Fast food",
  "Goan",
  "Gujarati",
  "Hyderabadi",
  "Ice cream",
  "Indian",
  "Indo-Chinese",
  "Italian",
  "Japanese",
  "Kashmiri",
  "Kerala",
  "Korean",
  "Lebanese",
  "Maharashtrian",
  "Mediterranean",
  "Mexican",
  "Mughlai",
  "North Indian",
  "Pizza",
  "Punjabi",
  "Rajasthani",
  "Rolls & wraps",
  "Sandwiches",
  "Seafood",
  "South Indian",
  "Street food",
  "Tandoor",
  "Thai",
  "Thali",
] as const;
export interface RestaurantRegistration {
  restaurantName: string;
  ownerName: string;
  mobile: string;
  /** Restaurant or cloud kitchen. */
  restaurantType: RestaurantType | "";
  /** Any mix of veg, egg and non-veg; menu items must match it. */
  foodServed: FoodType[];
  email: string;
  cuisines: string[];
  customerContact: string;
}
export interface Shift {
  start: string;
  end: string;
}
export interface OperatingDay {
  day: string;
  open: boolean;
  shifts: Shift[];
}
export interface MenuItem {
  type: ItemType | "";
  name: string;
  price: number;
  description: string;
  image: File | null;
}
export interface DocumentNumbers {
  gst: string;
  pan: string;
  fssai: string;
  identity: string;
  businessProof: string;
}
export interface RegistrationForm extends RestaurantRegistration {
  password: string;
  confirmPassword: string;
  address: string;
  building: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  /** Set when a location is picked from the search. */
  latitude: number | null;
  longitude: number | null;
  accountHolder: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifsc: string;
  bankName: string;
  documentNumbers: DocumentNumbers;
  documents: Record<string, File | null>;
  bankProof: File | null;
  coverPhoto: File | null;
  logo: File | null;
  hours: OperatingDay[];
  menuItems: MenuItem[];
  agreement: boolean;
}
export type RegistrationPayload = Omit<
  RegistrationForm,
  "confirmAccountNumber" | "confirmPassword"
>;
export const initialRegistration: RegistrationForm = {
  restaurantName: "",
  ownerName: "",
  mobile: "",
  restaurantType: "",
  foodServed: [],
  email: "",
  cuisines: [],
  customerContact: "",
  password: "",
  confirmPassword: "",
  address: "",
  building: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  latitude: null,
  longitude: null,
  accountHolder: "",
  accountNumber: "",
  confirmAccountNumber: "",
  ifsc: "",
  bankName: "",
  documentNumbers: {
    gst: "",
    pan: "",
    fssai: "",
    identity: "",
    businessProof: "",
  },
  documents: {
    gst: null,
    pan: null,
    fssai: null,
    identity: null,
    businessProof: null,
  },
  bankProof: null,
  coverPhoto: null,
  logo: null,
  hours: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((day) => ({
    day,
    open: true,
    shifts: [{ start: "11:00", end: "15:30" }],
  })),
  menuItems: [],
  agreement: false,
};
