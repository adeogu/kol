export type ListingStatus = "DRAFT" | "PUBLISHED" | "SUSPENDED";
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type Listing = {
  id: string;
  title: string;
  description: string;
  location: string;
  county: string;
  postal_code?: string | null;
  coordinates: unknown;
  land_size: number | null;
  access_type: "CAR" | "HIKE" | "BOTH";
  allowed_animals: string[];
  price_per_day: number;
  service_fee: number;
  rules: string | null;
  amenities: string[];
  images: { url: string; order?: number; caption?: string }[];
  status: ListingStatus;
  view_count: number;
  owner_id: string;
};

export type Booking = {
  id: string;
  listing_id: string;
  hunter_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  price_per_day: number;
  total_price: number;
  service_fee: number;
  grand_total: number;
  status: BookingStatus;
};
