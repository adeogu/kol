import { BookingRequestCard } from "@/components/landowner/booking-request-card";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Booking } from "@/types";

export default async function BookingsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title")
    .eq("owner_id", user?.id ?? "");

  const listingIds = listings?.map((listing) => listing.id) ?? [];

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, listings(title)")
    .in("listing_id", listingIds)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Bookings
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Manage booking requests
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(bookings ?? []).map((booking) => (
          <BookingRequestCard
            key={booking.id}
            booking={{
              ...(booking as Booking),
              listing_title: booking.listings?.title,
            }}
          />
        ))}
        {bookings?.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60">
            No bookings yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

