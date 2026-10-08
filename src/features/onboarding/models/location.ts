export interface LocationSuggestion {
  /** Full address shown in the search results. */
  label: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}
