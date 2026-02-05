# HuntStay

HuntStay is a role-based marketplace connecting hunters and landowners in Ireland. Hunters discover and book private land. Landowners list properties, manage availability, and earn from verified bookings.

## Tech stack

- Next.js App Router + TypeScript
- Supabase (Postgres + Auth + Storage + Realtime)
- Tailwind CSS
- Stripe payments

## Local setup

1. Create `.env.local` with the Supabase and Stripe keys listed in `PRD.md`.
2. Run `pnpm install`.
3. Run `pnpm dev`.

## Supabase

Run the SQL in `supabase/migrations/` to set up schema and RLS policies.
