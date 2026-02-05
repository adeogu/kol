# HuntStay - Product Requirements Document (Revised)

## Executive Summary

**HuntStay** is a web-based marketplace connecting hunters with landowners in Ireland. Hunters can discover, book, and pay for hunting access to private lands. Landowners can list their properties, manage availability, and earn income.

**Core Value Proposition**: "Airbnb for Hunting" — Simple, trust-based land booking for hunters in Ireland.

**Architecture Note**: Built on **Supabase** (PostgreSQL + Auth + Realtime) with **Next.js 14**, enabling separate, tailored experiences for Hunters and Landowners.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [User Personas & Flows](#user-personas--flows)
3. [Technical Architecture](#technical-architecture)
4. [Database Schema](#database-schema)
5. [API Specifications](#api-specifications)
6. [UI/UX Guidelines](#uiux-guidelines)
7. [Monetization](#monetization)
8. [Development Phases](#development-phases)
9. [Appendix](#appendix)

---

## Product Overview

### Vision
Create the most trusted platform for hunting land access in Ireland, making it easy for hunters to find quality land and for landowners to monetize their property safely.

### Target Market
- **Primary**: Ireland (Republic of Ireland + Northern Ireland)
- **Hunters**: Recreational hunters seeking private land access
- **Landowners**: Farmers, estate owners with hunting-suitable land

### Key Differentiators
1. **Role-Based Experiences**: Completely separate interfaces for hunters vs landowners
2. **Irish-Focused**: Tailored to Irish hunting regulations and wildlife
3. **Trust-First**: Verified users, reviews, and identity verification
4. **Simple Booking**: Calendar-based booking with instant confirmation
5. **No Subscriptions**: Pay-per-booking only

---

## User Personas & Flows

### Persona 1: The Hunter ("Sean")
- **Demographics**: 35-55 years old, lives in Dublin/Cork/Galway
- **Goals**: Find quality hunting land within 2 hours drive
- **Experience**: Map-first discovery, booking-focused dashboard, trip management

### Persona 2: The Landowner ("Mary")
- **Demographics**: 50+ years old, owns 50+ acres in rural Ireland
- **Goals**: Generate passive income from unused land
- **Experience**: Property management dashboard, booking requests inbox, earnings tracking

### Flow 1: Hunter Journey (Distinct Experience)

```
1. Visit HuntStay.ie → CTA: "Find Hunting Land" or "List Your Land"
   ↓
2. Sign Up/Login via Supabase Auth
   ↓
3. Role Selection: Select "I'm a Hunter"
   ↓
4. Hunter Onboarding:
   - Profile basics (name, avatar)
   - Hunting preferences (favorite animals, counties)
   - License upload (optional for MVP)
   ↓
5. Redirect to Hunter Dashboard:
   ┌─────────────────────────────────────┐
   │ [Discover] [My Trips] [Messages]    │
   │                                     │
   │ Interactive Map of Ireland          │
   │ [Filters: County, Animal, Price]    │
   │                                     │
   │ Saved Properties                    │
   └─────────────────────────────────────┘
   ↓
6. Browse Map → Click Listing → View Details
   ↓
7. "Book This Land" → Calendar Selection
   ↓
8. Booking Summary → Confirm (MVP: Manual confirmation)
   ↓
9. Hunter Dashboard Updates:
   - Trip added to "My Trips"
   - Chat enabled with Landowner
   ↓
10. Post-Hunt: Review prompt appears in dashboard
```

### Flow 2: Landowner Journey (Distinct Experience)

```
1. Visit HuntStay.ie → CTA: "List Your Land"
   ↓
2. Sign Up/Login via Supabase Auth
   ↓
3. Role Selection: Select "I Own Land"
   ↓
4. Landowner Onboarding:
   - Profile verification
   - Bank details (for payouts - Phase 2)
   - Identity verification upload
   ↓
5. Redirect to Landowner Dashboard:
   ┌─────────────────────────────────────┐
   │ [My Properties] [Bookings] [Inbox]  │
   │                                     │
   │ Earnings Summary: €X This Month     │
   │                                     │
   │ Property Listings (Cards)           │
   │ [+ Add New Property]                │
   │                                     │
   │ Pending Booking Requests            │
   └─────────────────────────────────────┘
   ↓
6. Create First Listing:
   - Upload photos (max 10)
   - Map location picker
   - Set rules, amenities, allowed animals
   - Pricing (€/day)
   - Availability calendar
   ↓
7. Publish → Live on platform
   ↓
8. Receive Booking Request:
   - Notification in dashboard
   - Review hunter profile
   - Accept/Decline
   ↓
9. Manage Bookings:
   - Calendar view of all bookings
   - Message hunter via inbox
   - Mark as completed
   ↓
10. Receive Payment (Phase 2)
```

---

## Technical Architecture

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 14 + TypeScript | SSR for SEO, App Router for layout groups |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid UI development |
| **Backend** | Next.js API Routes | Server actions for database operations |
| **Database** | **Supabase PostgreSQL** | Auth + DB + Realtime in one platform |
| **Auth** | **Supabase Auth** | Native integration, RLS policies, no webhooks needed |
| **Realtime** | **Supabase Realtime** | Built-in messaging subscriptions |
| **File Storage** | **Supabase Storage** | Native image uploads for listings |
| **Search** | PostgreSQL Full-Text + PostGIS | Advanced location search |
| **Maps** | Leaflet + OpenStreetMap | Free, no API key needed |
| **Payments** | Stripe (Phase 2) | Standard payouts |
| **Hosting** | Vercel (Frontend) + Supabase (Backend) | Optimal pairing |

### Why This Stack?
- **Supabase replaces 3 services**: Auth (Clerk) + Database (MySQL) + Messaging (WebSocket) → One platform
- **Row Level Security (RLS)**: Database-level permissions instead of middleware
- **Role-based routing**: Next.js route groups `(hunter)` vs `(landowner)` for clean separation
- **Type safety**: Supabase generates TypeScript types from schema

### Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Client Browser                  │
│  ┌─────────────┐    ┌───────────────┐  │
│  │   Hunter    │ or │  Landowner    │  │
│  │   Interface │    │  Interface    │  │
│  └─────────────┘    └───────────────┘  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Vercel (Next.js 14)                │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │  (hunter)    │  │  (landowner)    │  │
│  │   routes     │  │    routes       │  │
│  └──────────────┘  └─────────────────┘  │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │  Server      │  │  Server Actions │  │
│  │  Actions     │  │  (API Routes)   │  │
│  └──────────────┘  └─────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Supabase Platform                 │
│  ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │   Auth   │ │ PostgreSQL│ │Realtime│  │
│  │  (Users) │ │  (Data)   │ │ (Chat) │  │
│  └──────────┘ └──────────┘ └────────┘  │
│  ┌──────────┐                           │
│  │ Storage  │ (Images)                  │
│  └──────────┘                           │
└─────────────────────────────────────────┘
```

### Route Group Strategy

```
app/
├── (auth)/                    # Shared auth pages
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── onboarding/
│       ├── hunter/page.tsx    # Hunter-specific onboarding
│       └── landowner/page.tsx # Landowner-specific onboarding
├── (hunter)/                  # Hunter experience
│   ├── layout.tsx             # Hunter nav (Discover, Trips, Messages)
│   ├── dashboard/page.tsx     # Map-focused dashboard
│   ├── trips/page.tsx         # My bookings
│   └── discover/
│       └── [id]/page.tsx      # Listing detail (hunter view)
├── (landowner)/               # Landowner experience
│   ├── layout.tsx             # Landowner nav (Properties, Bookings, Inbox)
│   ├── dashboard/page.tsx     # Earnings & stats overview
│   ├── properties/page.tsx    # List/manage properties
│   ├── calendar/page.tsx      # Availability management
│   └── bookings/page.tsx      # Incoming requests
└── api/                       # Shared API routes (webhooks)
```

---

## Database Schema (Supabase PostgreSQL)

### Setup Notes
- Use **Supabase Dashboard** or **Supabase CLI** to apply migrations
- Enable **Row Level Security (RLS)** on all tables
- Enable **Realtime** for `messages` and `bookings` tables

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For location queries

-- ============================================
-- PROFILES TABLE (extends supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,

  -- Role determines which interface they see
  role TEXT CHECK (role IN ('HUNTER', 'LANDOWNER', 'ADMIN')) DEFAULT 'HUNTER',

  -- Hunter-specific fields
  hunting_preferences JSONB DEFAULT '[]'::jsonb, -- ["Deer", "Pheasant"]
  license_number TEXT,
  license_verified BOOLEAN DEFAULT FALSE,

  -- Landowner-specific fields
  phone TEXT,
  payout_account_id TEXT, -- Stripe Connect ID (Phase 2)

  -- Location
  county TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

  CONSTRAINT unique_email UNIQUE (email)
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'first_name', 
          NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- LISTINGS TABLE
-- ============================================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership (Landowner only)
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Basic Info
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Location (PostGIS for geo queries)
  location TEXT NOT NULL,
  county TEXT NOT NULL,
  coordinates GEOGRAPHY(POINT) NOT NULL,
  land_size DECIMAL(10, 2),

  -- Access & Hunting
  access_type TEXT CHECK (access_type IN ('CAR', 'HIKE', 'BOTH')) DEFAULT 'CAR',
  allowed_animals TEXT[] DEFAULT '{}',

  -- Pricing (EUR)
  price_per_day DECIMAL(10, 2) NOT NULL,
  service_fee DECIMAL(10, 2) DEFAULT 2.50,

  -- Details
  rules TEXT,
  amenities TEXT[] DEFAULT '{}',

  -- Media
  images JSONB DEFAULT '[]'::jsonb, -- [{url, order, caption}]

  -- Status
  status TEXT CHECK (status IN ('DRAFT', 'PUBLISHED', 'SUSPENDED')) DEFAULT 'DRAFT',

  -- Stats
  view_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Full-text search index
ALTER TABLE listings ADD COLUMN search_vector tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || description || ' ' || location)) STORED;
CREATE INDEX idx_listings_search ON listings USING GIN(search_vector);

-- Spatial index for map searches
CREATE INDEX idx_listings_coordinates ON listings USING GIST(coordinates);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  hunter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,

  -- Pricing
  price_per_day DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  service_fee DECIMAL(10, 2) DEFAULT 2.50,
  grand_total DECIMAL(10, 2) NOT NULL,

  -- Status
  status TEXT CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')) DEFAULT 'PENDING',

  -- Payment (Phase 2)
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Ensure no overlapping bookings for same listing
  CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
    listing_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  )
);

-- ============================================
-- REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ============================================
-- CONVERSATIONS & MESSAGES (Realtime enabled)
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  hunter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  landowner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

  UNIQUE(listing_id, hunter_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Realtime for messages
ALTER TABLE messages REPLICA IDENTITY FULL;

-- ============================================
-- FAVORITES TABLE
-- ============================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),

  UNIQUE(user_id, listing_id)
);
```

### Row Level Security (RLS) Policies

```sql
-- Profiles: Users can read all, update own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings: Public read, Landowner write own
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published listings are viewable by everyone"
  ON listings FOR SELECT USING (status = 'PUBLISHED');

CREATE POLICY "Landowners can view own drafts"
  ON listings FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Landowners can insert own listings"
  ON listings FOR INSERT WITH CHECK (
    owner_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'LANDOWNER')
  );

CREATE POLICY "Landowners can update own listings"
  ON listings FOR UPDATE USING (owner_id = auth.uid());

-- Bookings: Hunter sees own, Landowner sees listing bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hunters can view own bookings"
  ON bookings FOR SELECT USING (hunter_id = auth.uid());

CREATE POLICY "Landowners can view bookings for their listings"
  ON bookings FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE listings.id = bookings.listing_id 
      AND listings.owner_id = auth.uid()
    )
  );

CREATE POLICY "Hunters can create bookings"
  ON bookings FOR INSERT WITH CHECK (
    hunter_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'HUNTER')
  );

-- Messages: Participants only
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id
      AND (conversations.hunter_id = auth.uid() OR conversations.landowner_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id
      AND (conversations.hunter_id = auth.uid() OR conversations.landowner_id = auth.uid())
    )
  );
```

---

## API Specifications

### Supabase Client Setup

**`lib/supabase/server.ts`**
```typescript
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  )
}

export function getServerUser() {
  const cookieStore = cookies()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          cookie: cookieStore.toString()
        }
      }
    }
  )
}
```

**`lib/supabase/client.ts`**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function getClientClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Actions (Replacing API Routes)

**`app/(hunter)/actions.ts`**
```typescript
'use server'
import { getServerClient } from '@/lib/supabase/server'

export async function searchListings(filters: SearchFilters) {
  const supabase = getServerClient()

  let query = supabase
    .from('listings')
    .select('*, profiles!inner(first_name, avatar_url)')
    .eq('status', 'PUBLISHED')

  if (filters.county) {
    query = query.eq('county', filters.county)
  }

  if (filters.animals?.length) {
    query = query.contains('allowed_animals', filters.animals)
  }

  if (filters.bounds) {
    // PostGIS spatial query
    query = query.filter(
      'coordinates', 
      'st_within', 
      `SRID=4326;POLYGON((...))`
    )
  }

  return await query
}

export async function createBooking(bookingData: BookingInput) {
  const supabase = getServerClient()

  // RLS ensures only hunters can insert
  const { data, error } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select()
    .single()

  return { data, error }
}
```

**`app/(landowner)/actions.ts`**
```typescript
'use server'
export async function createListing(listingData: ListingInput) {
  const supabase = getServerClient()

  // RLS ensures only landowners can insert
  const { data, error } = await supabase
    .from('listings')
    .insert(listingData)
    .select()
    .single()

  return { data, error }
}

export async function getLandownerBookings() {
  const supabase = getServerClient()

  // RLS handles permission - only returns bookings for this landowner's listings
  return await supabase
    .from('bookings')
    .select('*, listings(title), profiles!hunter_id(first_name, avatar_url)')
    .order('created_at', { ascending: false })
}
```

### Realtime Messaging Hook

**`hooks/use-messages.ts`**
```typescript
'use client'
import { useEffect } from 'react'
import { getClientClient } from '@/lib/supabase/client'

export function useMessages(conversationId: string) {
  const supabase = getClientClient()

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, 
        (payload) => {
          // Handle new message
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])
}
```

---

## UI/UX Guidelines

### Hunter Interface Design

**Primary Navigation:**
- **Discover** (Map view - default landing)
- **My Trips** (Upcoming/past bookings)
- **Messages** (Chat with landowners)
- **Saved** (Favorites list)

**Key UI Elements:**
- **Map-centric**: Large interactive map taking 60% of dashboard
- **Listing Cards**: Horizontal scroll on mobile, grid on desktop
- **Booking Flow**: Bottom sheet on mobile, sidebar on desktop
- **Color accents**: Forest green primary, amber for CTAs

### Landowner Interface Design

**Primary Navigation:**
- **Dashboard** (Stats, earnings, quick actions)
- **My Properties** (Manage listings)
- **Bookings** (Incoming requests, calendar)
- **Inbox** (Messages from hunters)

**Key UI Elements:**
- **Stats Cards**: Earnings this month, occupancy rate, total bookings
- **Property Management**: Card-based layout with quick-edit actions
- **Booking Requests**: Inbox-style list with accept/decline actions
- **Calendar View**: Full availability management (Google Calendar style)

### Shared Components

**Role-Based Layout Switcher:**
```typescript
// app/layout.tsx
export default async function RootLayout({ children }) {
  const supabase = getServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <MarketingLayout>{children}</MarketingLayout>

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'LANDOWNER' 
    ? <LandownerLayout>{children}</LandownerLayout>
    : <HunterLayout>{children}</HunterLayout>
}
```

---

## Monetization

### Revenue Model
- **No subscriptions** — Pay per booking only
- **Service fee**: €2.50 per booking (paid by hunter)
- **Landowner gets**: 100% of daily rate × days booked

### Payment Flow (Phase 2)
```
1. Hunter confirms booking
2. Stripe Checkout opens
3. Hunter pays: (days × daily rate) + €2.50
4. Stripe holds funds
5. Landowner receives payment immediately (or after hunt)
6. HuntStay keeps €2.50 service fee
```

### Pricing Guidelines for Landowners
- Suggested range: €30-€150 per day
- Factors: Land size, animal variety, amenities, location

---

## Testing & Quality Assurance Strategy

> **Critical Note for AI Implementation**: All features must include explicit test specifications. Do not infer behavior—implement exactly as specified below. Every user interaction must have defined expected outcomes, error states, and edge cases.

### Testing Philosophy
- **Test-Driven Development (TDD)**: Write tests before implementation
- **Behavior-Driven Development (BDD)**: Use Given/When/Then format for clarity
- **Edge-First Design**: Account for failure modes before success paths

---

## 1. Critical User Flows & Test Cases

### 1.1 Authentication & Onboarding

#### Test Suite: Role Selection Flow
```
Test Case: AUTH-001
Title: New user selects Hunter role during onboarding
Given: User has just registered via Supabase Auth
When: 
  1. User lands on /onboarding page
  2. User clicks "I'm a Hunter" card
  3. User fills display name (required)
  4. User clicks "Continue"
Then:
  - Profile.role is set to "HUNTER" in database
  - User is redirected to /dashboard (Hunter interface)
  - "Discover" tab is active by default
  - Map component loads with Ireland bounding box

Edge Cases:
  - Empty display name: Show error "Display name is required", disable Continue button
  - Special characters in name: Allow alphanumeric + spaces only, max 50 chars
  - Network failure during save: Show toast "Unable to save. Retry?", keep form state
  - User refreshes mid-onboarding: Return to same step with data preserved (localStorage)
```

```
Test Case: AUTH-002
Title: Returning user auto-redirected based on role
Given: User has existing profile with role="LANDOWNER"
When: User logs in via /login
Then:
  - POST /auth/callback succeeds
  - Query: SELECT role FROM profiles WHERE id = auth.uid()
  - Redirect to /dashboard (Landowner interface), not onboarding
  - Load time < 2 seconds (show skeleton screen during auth check)

Edge Cases:
  - JWT expired: Redirect to /login with message "Session expired. Please sign in again"
  - Profile missing (data integrity issue): Redirect to onboarding with auth.user metadata pre-filled
  - Role is NULL: Force onboarding completion before app access
```

#### Test Suite: Protected Routes
```
Test Case: AUTH-003
Title: Hunter cannot access Landowner routes
Given: Authenticated user with role="HUNTER"
When: User navigates to /properties (Landowner-only route)
Then:
  - Middleware checks profile.role
  - Redirect to /dashboard (Hunter) with 403 toast: "Access denied"
  - URL changes from /properties to /dashboard

Test Case: AUTH-004
Title: Unauthenticated user access attempt
Given: No valid session cookie
When: User visits /dashboard, /bookings, or /messages
Then:
  - Redirect to /login?redirect=/original-path
  - After successful login, redirect to original intended destination
  - Store redirect path in query param, NOT localStorage (security)
```

---

### 1.2 Listing Creation (Landowner)

#### Test Suite: Property Creation Form
```
Test Case: LIST-001
Title: Complete property creation with all fields
Given: Landowner on /properties/new
When:
  1. Title entered: "50-Acre Kerry Deer Forest" (20-100 chars)
  2. Description entered: Valid markdown/text (min 100 chars)
  3. Location selected: Map clicked, coordinates saved, county auto-detected
  4. Land size: 50 (acres, numeric, 0.1-10000)
  5. Access type: "CAR" selected (radio button)
  6. Animals: ["Deer", "Pheasant"] selected (multi-select)
  7. Price: 75.00 (EUR, min 10.00, max 1000.00)
  8. Amenities: ["Parking", "Shelter"] selected
  9. Rules: "No Sunday hunting" (optional, max 1000 chars)
  10. Images: 3-10 images uploaded (each < 5MB, jpg/png/webp)
  11. Click "Publish"
Then:
  - POST action creates listing with status="PUBLISHED"
  - Images uploaded to Supabase Storage bucket "listing-images"
  - Database record includes owner_id = auth.uid()
  - Redirect to /properties with success toast: "Property published successfully"
  - New listing appears in grid within 2 seconds (optimistic UI)

State Management:
  - Form state persists in localStorage every 10 seconds (draft auto-save)
  - On unload with unsaved changes: Show browser confirm dialog
  - Loading state: Publish button shows spinner, disabled during submission
```

```
Test Case: LIST-002
Title: Image upload validation and progress
Given: Landowner on image upload step
When:
  1. User selects file > 5MB
  Then: Immediate error "Image must be less than 5MB", reject upload

  2. User selects 12 images
  Then: Error "Maximum 10 images allowed", only first 10 queued

  3. User selects .txt file
  Then: Error "Only JPG, PNG, WebP images allowed"

  4. User drags 3 valid images
  Then: 
    - Thumbnails appear immediately (base64 preview)
    - Upload progress bars show % completion
    - On completion, URLs saved to form state
    - Failed uploads show retry button per image

Edge Cases:
  - Upload interrupted (network loss): Pause, show "Upload failed. Retry?", preserve completed uploads
  - Duplicate image: Allow (user might want same image twice with different captions)
  - HEIC from iPhone: Auto-convert to JPG or show conversion error with instructions
```

```
Test Case: LIST-003
Title: Map location picker functionality
Given: Landowner on location step
When:
  1. User clicks map at coordinates (52.668, -8.63)
  Then:
    - Marker drops at location
    - Reverse geocoding fetches "County Clare"
    - County dropdown auto-selects "Clare"
    - Latitude/longitude fields populated (hidden or visible)

  2. User searches "Killarney National Park" in location search
  Then:
    - Geocoding API returns suggestions
    - User selects suggestion, map pans to location
    - Marker placed, county detected

Edge Cases:
  - User clicks ocean (outside Ireland): Show error "Please select a location in Ireland"
  - Geocoding fails: Allow manual county selection from dropdown (32 counties)
  - Map doesn't load (API failure): Show "Map unavailable" with manual coordinate input fields
```

```
Test Case: LIST-004
Title: Form validation edge cases
Given: Landowner filling form
Validation Rules:
  - Title: Required, 10-100 chars, no HTML tags (XSS prevention)
  - Price: Required, numeric, 10.00-1000.00, 2 decimal places max
  - Description: Required, 100-2000 chars
  - Animals: At least 1 selection required

Error Display:
  - Real-time validation on blur (not on every keystroke to avoid noise)
  - Submit button disabled until all validations pass
  - Error messages appear below fields in red text with icon
  - Scroll to first error on attempted submit
```

---

### 1.3 Booking Flow (Hunter)

#### Test Suite: Calendar & Date Selection
```
Test Case: BOOK-001
Title: Hunter selects available dates
Given: Hunter viewing listing with existing booking Dec 15-17
When:
  1. Calendar component loads
  Then:
    - Dec 15, 16, 17 marked as "unavailable" (red/gray)
    - Available dates clickable (white/green)
    - Past dates disabled (before today)

  2. User clicks Dec 18 (check-in)
  Then: Dec 18 highlighted as start date

  3. User clicks Dec 20 (check-out)
  Then:
    - Range Dec 18-20 highlighted
    - "3 days" calculated and displayed
    - Price calculation: 3 × €75 = €225 + €2.50 fee = €227.50
    - "Book Now" button becomes enabled

Edge Cases:
  - User clicks unavailable date: Show tooltip "Dates already booked"
  - User selects range overlapping existing booking: Disable selection, show error "Selection conflicts with existing booking"
  - Max booking duration: 14 days (if >14, show error "Maximum 14 days per booking")
  - Same day booking: Allow if before 6 PM local time, else disable today
```

```
Test Case: BOOK-002
Title: Double-booking prevention (race condition)
Given: Two hunters view same listing simultaneously
When:
  - Hunter A selects dates Dec 18-20 and clicks "Book"
  - Hunter B (different session) selects same dates Dec 18-20 and clicks "Book" 0.5s later
Then:
  - Hunter A: Booking status="PENDING", success message
  - Hunter B: Error "Dates just became unavailable", calendar refreshes to show blocked dates
  - Database constraint (EXCLUDE USING gist) prevents overlapping bookings
  - UI polling every 10 seconds shows live availability updates
```

```
Test Case: BOOK-003
Title: Booking confirmation flow
Given: Hunter clicks "Confirm Booking" on summary modal
When:
  1. API call POST /bookings initiated
  Then: Button shows loading spinner, text changes to "Processing..."

  2. API succeeds (201 Created)
  Then:
    - Modal closes
    - Toast: "Booking request sent to landowner"
    - Redirect to /trips (Hunter dashboard)
    - New booking appears in "Upcoming" tab with status="PENDING"
    - Message button enabled to contact landowner

  3. API fails (500 Error)
  Then:
    - Button returns to "Confirm Booking" (enabled)
    - Error toast: "Unable to process booking. Please try again."
    - Form state preserved, user can retry
    - If error persists after 3 retries, show "Contact support" link

Edge Cases:
  - Network timeout (30s): Show "Request timed out. Check your internet connection."
  - Listing deleted during booking: Error "This listing is no longer available"
  - Price changed during booking: Error "Price updated. Please review new total.", refresh calculation
```

#### Test Suite: Booking Management (Landowner)
```
Test Case: BOOK-004
Title: Landowner accepts booking request
Given: Landowner viewing /bookings with pending request
When:
  1. Landowner clicks "Accept" on booking card
  Then: 
    - Confirmation modal: "Accept booking for Sean, Dec 18-20?"
    - Options: "Accept" (primary), "Decline" (secondary), "Cancel" (tertiary)

  2. Landowner confirms "Accept"
  Then:
    - PATCH booking status="CONFIRMED"
    - Realtime notification sent to Hunter
    - Booking moves from "Pending" to "Confirmed" tab
    - Dates blocked on calendar (irreversible)
    - Success toast: "Booking confirmed. Hunter has been notified."
    - Email notification triggered (if configured)

Edge Cases:
  - Landowner tries to accept overlapping booking: Database prevents with constraint error, show "Dates conflict with existing confirmed booking"
  - Landowner declines: Status="CANCELLED", hunter notified, dates freed
  - Landowner doesn't respond within 48h: Auto-decline, hunter refunded (Phase 2)
```

---

### 1.4 Realtime Messaging

#### Test Suite: Chat Functionality
```
Test Case: MSG-001
Title: Hunter sends message to Landowner
Given: Hunter on conversation page for Booking #123
When:
  1. User types "Hi, is there parking nearby?" in input field
  Then: Send button enabled (disabled if empty or only whitespace)

  2. User clicks Send (or presses Enter)
  Then:
    - Message appears immediately in chat (optimistic UI, greyed out)
    - API inserts into messages table
    - On confirmation, message turns black (delivered)
    - Landowner receives realtime notification (Supabase Realtime)
    - Input field clears, focus returns to input

  3. Landowner opens chat
  Then:
    - Messages load chronologically (oldest first)
    - Scroll to bottom (most recent)
    - Hunter's message marked as read (is_read=true)
    - "Read at" timestamp recorded

Edge Cases:
  - Message > 1000 chars: Disable send, show char counter "1000/1000" in red
  - HTML/script injection: Sanitize input, render as plain text
  - Send fails (offline): Show "Message failed to send" with retry button
  - Rapid sends (>1 msg/sec): Rate limit error "Please wait before sending another message"
  - Landowner offline: Message stored, delivered when they reconnect (within 30 days retention)
```

```
Test Case: MSG-002
Title: Conversation creation flow
Given: Hunter wants to message about Listing #456 (no prior conversation)
When:
  1. Hunter clicks "Message Landowner" on listing page
  Then:
    - Check: SELECT * FROM conversations WHERE listing_id=456 AND hunter_id=current_user
    - If exists: Navigate to existing conversation
    - If not exists: INSERT new conversation, then navigate

  2. Hunter sends first message
  Then:
    - Landowner sees new conversation in inbox with "New" badge
    - Conversation appears in list with snippet of message
    - Unread count increments on navigation badge

Edge Cases:
  - Hunter tries to message own listing: Disable button with tooltip "You cannot message yourself"
  - Listing archived/deleted: Error "This conversation is no longer available"
```

---

### 1.5 Search & Discovery (Map)

#### Test Suite: Map Interactions
```
Test Case: SEARCH-001
Title: Map bounds filtering
Given: Hunter on /dashboard with map view
When:
  1. User pans map to show County Kerry only
  Then:
    - Debounce API call (300ms after pan stops)
    - Query: SELECT * FROM listings WHERE coordinates @> map_bounds AND status='PUBLISHED'
    - Listing cards update to show only visible properties
    - URL updates with ?bounds=sw_lat,sw_lng,ne_lat,ne_lng (shareable state)

  2. User zooms out to show all Ireland
  Then: Max 100 results returned, "Showing 100 of 250 properties" message

  3. User clicks map marker
  Then:
    - Marker bounces/highlighted
    - Card scrolls into view in sidebar
    - Card highlighted with border color

Edge Cases:
  - Map area has no listings: Show empty state "No properties in this area. Try zooming out."
  - Map fails to load (Leaflet error): Show list view fallback with toggle "Switch to List View"
  - Mobile touch gestures: Pinch to zoom, double-tap to zoom, pan with single finger
```

```
Test Case: SEARCH-002
Title: Filter combination logic
Given: Hunter applies multiple filters
Filters Available:
  - County: "Kerry" (dropdown)
  - Animals: ["Deer", "Pheasant"] (multi-select chips)
  - Price Range: €50-€100 (dual slider)
  - Access Type: "CAR" (radio)

Logic: AND logic between filter types, OR within arrays (Animals)
Query Pattern:
  WHERE county = 'Kerry'
  AND allowed_animals && ['Deer', 'Pheasant']  // Overlap operator
  AND price_per_day BETWEEN 50 AND 100
  AND access_type = 'CAR'

When: User changes any filter
Then:
  - Debounce 200ms to avoid rapid re-queries
  - Show loading skeleton on listing cards
  - Update results count: "12 properties found"
  - If 0 results: Show "No matches. Try adjusting filters." with "Clear all" button

Edge Cases:
  - Invalid price range (max < min): Auto-correct min to max-10
  - URL sharing with invalid params: Ignore invalid, apply valid, show toast "Some filters were invalid"
```

---

## 2. Component-Level Test Specifications

### 2.1 Input Components

```
Component: DateRangePicker
Props: disabledDates, maxRange, onSelect

Test: Valid Range Selection
Given: disabledDates = ["2024-12-25", "2024-12-26"]
When: User clicks Dec 24, then Dec 27
Then: Selection valid, onSelect called with {start: "2024-12-24", end: "2024-12-27"}

Test: Invalid Range (includes disabled)
When: User clicks Dec 23, then Dec 28
Then: Selection invalid, visual indicator on Dec 25-26, error tooltip "Range includes unavailable dates"

Test: Max Range Exceeded
Given: maxRange = 7
When: User selects 10-day range
Then: Day 8+ disabled, tooltip "Maximum 7 days allowed"
```

```
Component: ImageUploader
Props: maxFiles, maxSize, acceptedTypes, onUpload

Test: File Type Validation
When: User drops "document.pdf"
Then: Reject file, show "Only images allowed (JPG, PNG, WebP)"

Test: File Size Validation
Given: maxSize = 5242880 (5MB)
When: User selects 6MB image
Then: Reject, show "Image must be under 5MB. This image is 6.2MB."

Test: Upload Progress
When: User uploads 3 valid images
Then:
  - Each shows progress bar 0-100%
  - Thumbnail preview visible
  - On complete: Green checkmark, "Uploaded" text
  - On error: Red X, "Failed", retry button
```

### 2.2 Async State Management

```
Pattern: Mutation States
All API mutations must handle:
1. Idle: Button clickable, no loading indicators
2. Loading: Button disabled, spinner visible, text changes to "[Action]ing..."
3. Success: Toast notification, UI updates optimistically or refreshes
4. Error: Button re-enabled, error message displayed (field-level or toast), form state preserved
5. Timeout: After 30s, show "Request timed out", allow retry

Required for: Create Listing, Update Listing, Create Booking, Send Message, Update Profile
```

---

## 3. Edge Cases & Error Handling

### 3.1 Network Failures
```
Scenario: Intermittent connection
Behavior:
  - Show persistent banner "Connection lost. Retrying..." (not blocking modal)
  - Queue user actions (like messages) in IndexedDB
  - Auto-retry API calls with exponential backoff (1s, 2s, 4s, 8s max)
  - On reconnect: Sync queued actions, remove banner

Scenario: Permanent offline ( > 30s)
Behavior:
  - Show "You're offline" full-screen overlay on actions requiring network
  - Allow browsing cached listings (read-only mode)
  - Disable booking buttons with tooltip "Requires internet connection"
```

### 3.2 Data Integrity
```
Scenario: User deletes account
Expected:
  - Soft delete: Set profiles.is_active = false
  - Listings unpublished but preserved for booking history
  - Bookings preserved but marked "User deleted"
  - Messages anonymized ("Deleted User")
  - Auth user deleted from Supabase Auth (cascade via FK)

Scenario: Listing deleted with active bookings
Expected:
  - Prevent deletion if any bookings status IN ('PENDING', 'CONFIRMED')
  - Error: "Cannot delete property with active bookings"
  - Allow deletion only if all bookings COMPLETED or CANCELLED
```

### 3.3 Security Edge Cases
```
Test: SQL Injection via search
Input: "'; DROP TABLE listings; --"
Expected: Input sanitized, search treated as literal string, no database error

Test: XSS via chat message
Input: "<script>alert('xss')</script>"
Expected: Rendered as plain text, script not executed, stored sanitized in DB

Test: IDOR (Insecure Direct Object Reference)
Scenario: Hunter A tries to access Hunter B's booking via URL /bookings/[id]
Expected: 404 Not Found (not 403, to prevent ID enumeration), RLS prevents data leak

Test: Rate Limiting
Scenario: User attempts 100 login attempts in 1 minute
Expected: Account locked for 15 minutes, email sent to user
```

---

## 4. Mobile-Responsive Specifications

### Breakpoints
- **Mobile**: < 640px (Single column, bottom sheets, hamburger menu)
- **Tablet**: 640px-1024px (2-column grid, side drawer)
- **Desktop**: > 1024px (Full layout, hover states enabled)

### Mobile-Specific Interactions
```
Component: Booking Calendar on Mobile
Behavior:
  - Display as bottom sheet (not modal)
  - "Swipe up to expand" hint
  - Date selection: Single tap check-in, second tap check-out
  - "Confirm Dates" fixed button at bottom
  - Close on backdrop tap or swipe down

Component: Chat on Mobile
Behavior:
  - Input field fixed above keyboard
  - "Pull to refresh" loads older messages
  - Image uploads: Direct camera access or gallery
  - Push notifications for new messages (request permission on first message)
```

### Touch Targets
- Minimum 44x44px for all interactive elements
- Button spacing minimum 8px
- Map markers must be tappable (min 30px visual, 44px touch target)

---

## 5. Performance Requirements

### Load Times
- **Initial page load**: < 3s (Time to Interactive)
- **API response**: < 500ms (95th percentile)
- **Map tiles**: < 1s initial load
- **Image upload**: Progress indication if > 2s
- **Search results**: < 300ms with skeleton loading state

### Optimization Rules
- Images: Next.js Image component with lazy loading, WebP format
- Fonts: Preload Inter, font-display: swap
- API: Implement cursor-based pagination (not offset), max 50 items/page
- Map: Cluster markers when > 100 visible (use Supercluster)
- Bundle: Code split by route groups (hunter vs landowner)

---

## 6. Testing Checklist for AI Implementation

Before considering a feature "complete", verify:

- [ ] **Happy Path**: User completes flow without errors
- [ ] **Validation**: All invalid inputs rejected with clear messages
- [ ] **Network Failure**: Error handling for offline/API failure
- [ ] **Race Conditions**: Simultaneous actions handled correctly (e.g., double-click)
- [ ] **Auth States**: Behavior correct for unauthenticated/authenticated/wrong role
- [ ] **Mobile**: Touch interactions work, responsive layout correct
- [ ] **Accessibility**: Keyboard navigation, ARIA labels, color contrast (WCAG AA)
- [ ] **Security**: RLS policies active, no data leaks between users

### Automated Test Generation Prompts
When implementing features, use these test prompts with AI:

```
"Generate Jest/React Testing Library tests for [Component] covering:
1. Rendering with default props
2. User interaction (click, type, submit)
3. API success and failure states
4. Edge cases: empty state, loading state, error state
5. Accessibility: keyboard navigation, screen reader labels"

"Generate Playwright E2E tests for [Flow] covering:
1. Complete user journey from start to finish
2. Mobile viewport simulation
3. Network throttling (3G speed)
4. Auth state management (login/logout)
5. Data persistence (reload page, verify state)"
```

---


## Development Phases

### Phase 1: MVP (Weeks 1-4)

**Goal**: Core functionality with dual interfaces

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | **Setup + Auth** | Supabase project, schema migration, role-based routing, onboarding flows |
| 2 | **Landowner Experience** | Property creation, image upload, calendar management, landowner dashboard |
| 3 | **Hunter Experience** | Map integration, search/filters, booking flow, hunter dashboard |
| 4 | **Messaging + Polish** | Realtime chat, reviews, responsive design, RLS policies |

**Phase 1 Definition of Done:**
- [ ] Role selection on onboarding (Hunter vs Landowner)
- [ ] Distinct dashboards for each role
- [ ] Landowners can create and publish listings
- [ ] Hunters can search via map and book
- [ ] Realtime messaging working
- [ ] Reviews system functional
- [ ] RLS policies securing all data

### Phase 2: Payments & Verification (Weeks 5-6)

| Week | Focus | Deliverables |
|------|-------|--------------|
| 5 | **Stripe Integration** | Hunter payments, landowner payouts, service fees |
| 6 | **Verification** | License upload for hunters, identity verification for landowners |

---

## File Structure (Updated)

```
huntstay/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx              # Clean auth layout
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── onboarding/
│   │       ├── page.tsx            # Role selection
│   │       ├── hunter/page.tsx     # Hunter profile setup
│   │       └── landowner/page.tsx  # Landowner verification
│   ├── (hunter)/                   # Hunter-specific routes
│   │   ├── layout.tsx              # Hunter navigation
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Map + discovery
│   │   ├── trips/
│   │   │   └── page.tsx            # My bookings
│   │   ├── saved/
│   │   │   └── page.tsx            # Favorites
│   │   └── discover/
│   │       └── [id]/
│   │           └── page.tsx        # Listing detail
│   ├── (landowner)/                # Landowner-specific routes
│   │   ├── layout.tsx              # Landowner navigation
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Stats + overview
│   │   ├── properties/
│   │   │   ├── page.tsx            # List properties
│   │   │   ├── new/page.tsx        # Create listing
│   │   │   └── [id]/edit/page.tsx  # Edit listing
│   │   ├── bookings/
│   │   │   └── page.tsx            # Manage requests
│   │   └── calendar/
│   │       └── page.tsx            # Availability mgmt
│   ├── (shared)/                   # Shared authenticated routes
│   │   ├── messages/
│   │   │   └── page.tsx            # Chat interface
│   │   └── profile/
│   │       └── page.tsx            # Settings
│   ├── api/                        # Webhooks only
│   │   └── webhooks/
│   │       └── stripe/route.ts     # Payment webhooks
│   ├── layout.tsx                  # Root layout with role detection
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn components
│   ├── hunter/                     # Hunter-specific components
│   │   ├── map-view.tsx
│   │   ├── listing-card.tsx
│   │   └── booking-calendar.tsx
│   ├── landowner/                  # Landowner-specific components
│   │   ├── property-form.tsx
│   │   ├── booking-request-card.tsx
│   │   └── earnings-chart.tsx
│   └── shared/                     # Shared components
│       ├── message-list.tsx
│       └── review-card.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts                # Generated types
│   ├── actions/                    # Server actions organized by role
│   │   ├── hunter-actions.ts
│   │   └── landowner-actions.ts
│   └── utils.ts
├── hooks/
│   ├── use-realtime.ts
│   └── use-role.ts
├── types/
│   └── index.ts
└── supabase/
    └── migrations/                 # SQL migrations
        ├── 001_initial_schema.sql
        └── 002_rls_policies.sql
```

---

## Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe (Phase 2)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Migration Notes (From Clerk/MySQL)

1. **Auth State**: Replace `auth()` from Clerk with Supabase `getUser()` in server components
2. **Data Fetching**: Replace raw SQL queries with Supabase client methods
3. **Real-time**: Remove Socket.io/WebSocket code, use Supabase Realtime channels
4. **File Uploads**: Move from Cloudinary to Supabase Storage
5. **Security**: Move from middleware route protection to RLS policies (more secure, database-level)

---

*Document Version: 4.0 (Supabase + Dual Interface Edition)*
*Last Updated: February 2025*
