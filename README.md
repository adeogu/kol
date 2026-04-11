# HuntStay

HuntStay is a role-based marketplace connecting hunters and landowners in Ireland. Hunters discover and book private land. Landowners list properties, manage availability, and earn from verified bookings.

## Tech stack

- Next.js App Router + TypeScript
- Supabase (Postgres + Auth + Storage + Realtime)
- Tailwind CSS
- Stripe payments

## Local setup

1. Create `.env.local` with the Supabase and Stripe keys listed in `PRD.md`.
2. Add `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
3. Keep `NEXT_PUBLIC_ENABLE_SW_IN_DEV=false` for normal dev.
4. (Optional) configure web push:
   - `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY`
   - `WEB_PUSH_VAPID_PRIVATE_KEY`
   - `WEB_PUSH_VAPID_SUBJECT`
5. Generate VAPID keys with:
   - `npx web-push generate-vapid-keys`
6. (Optional for local push testing) set `NEXT_PUBLIC_ENABLE_SW_IN_DEV=true`.
7. Run `pnpm install`.
8. Run `pnpm dev`.

## Supabase

Run the SQL in `supabase/migrations/` to set up schema and RLS policies.

## License Verification Microservice

The FastAPI verification service lives in `services/license-verification`.
For local testing, use Python 3.12 (the CI workflow uses 3.12).

## Push delivery events

When push is configured, HuntStay sends notifications for:
- new conversation messages
- new booking requests
- booking confirmations/declines
- license verification result updates
