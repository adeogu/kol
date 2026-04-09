export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          role: "HUNTER" | "LANDOWNER" | "ADMIN";
          hunting_preferences: Json;
          license_number: string | null;
          license_verified: boolean;
          license_status:
            | "UNVERIFIED"
            | "PENDING"
            | "VERIFIED"
            | "REJECTED"
            | "NEEDS_REVIEW"
            | null;
          license_verified_at: string | null;
          license_expiry_date: string | null;
          license_document_url: string | null;
          phone: string | null;
          payout_account_id: string | null;
          identity_document_url: string | null;
          county: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string;
          location: string;
          county: string;
          postal_code: string | null;
          coordinates: unknown;
          land_size: number | null;
          access_type: "CAR" | "HIKE" | "BOTH";
          allowed_animals: string[];
          price_per_day: number;
          service_fee: number;
          rules: string | null;
          amenities: string[];
          images: Json;
          status: "DRAFT" | "PUBLISHED" | "SUSPENDED";
          view_count: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["listings"]["Row"]> & {
          owner_id: string;
          title: string;
          description: string;
          location: string;
          county: string;
          postal_code?: string | null;
          coordinates: unknown;
          price_per_day: number;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Row"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
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
          status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
          stripe_payment_intent_id: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
          confirmed_at: string | null;
          cancelled_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["bookings"]["Row"]> & {
          listing_id: string;
          hunter_id: string;
          start_date: string;
          end_date: string;
          total_days: number;
          price_per_day: number;
          total_price: number;
          grand_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          listing_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]> & {
          booking_id: string;
          listing_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
        Relationships: [];
      };
      hunter_license_verifications: {
        Row: {
          id: string;
          hunter_id: string;
          license_document_url: string | null;
          extracted_license_number: string | null;
          extracted_holder_name: string | null;
          extracted_license_type: string | null;
          extracted_county: string | null;
          extracted_expiry_date: string | null;
          confidence_score: number | null;
          status: "PENDING" | "VERIFIED" | "REJECTED" | "NEEDS_REVIEW";
          reasons: Json;
          raw_response: Json;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["hunter_license_verifications"]["Row"]
        > & {
          hunter_id: string;
          status: "PENDING" | "VERIFIED" | "REJECTED" | "NEEDS_REVIEW";
        };
        Update: Partial<
          Database["public"]["Tables"]["hunter_license_verifications"]["Row"]
        >;
        Relationships: [];
      };
      booking_license_snapshots: {
        Row: {
          id: string;
          booking_id: string;
          hunter_id: string;
          landowner_id: string;
          license_number: string | null;
          holder_name: string | null;
          license_type: string | null;
          county: string | null;
          expiry_date: string | null;
          status: "VERIFIED" | "REJECTED" | "NEEDS_REVIEW" | "UNVERIFIED";
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["booking_license_snapshots"]["Row"]
        > & {
          booking_id: string;
          hunter_id: string;
          landowner_id: string;
          status: "VERIFIED" | "REJECTED" | "NEEDS_REVIEW" | "UNVERIFIED";
        };
        Update: Partial<
          Database["public"]["Tables"]["booking_license_snapshots"]["Row"]
        >;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
          user_agent: string | null;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]> & {
          user_id: string;
          endpoint: string;
          p256dh_key: string;
          auth_key: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subscriptions"]["Row"]>;
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          listing_id: string;
          hunter_id: string;
          landowner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["conversations"]["Row"]> & {
          listing_id: string;
          hunter_id: string;
          landowner_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Row"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["messages"]["Row"]> & {
          conversation_id: string;
          sender_id: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Row"]>;
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["favorites"]["Row"]> & {
          user_id: string;
          listing_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["favorites"]["Row"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
