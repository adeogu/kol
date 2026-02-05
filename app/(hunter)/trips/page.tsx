import { ReviewForm } from "@/components/hunter/review-form";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Booking } from "@/types";

export default async function TripsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("bookings")
    .select("*, listings(*)")
    .eq("hunter_id", user?.id ?? "")
    .order("start_date", { ascending: false });

  const bookings =
    (data as Array<
      Booking & { listings?: { title?: string | null; owner_id?: string | null } | null }
    >) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          My trips
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Manage your hunting bookings
        </h1>
      </div>
      <div className="grid gap-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-3xl border border-ink/10 bg-white p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {booking.listings?.title ?? "Listing"}
                </p>
                <p className="text-xs text-ink/60">
                  {booking.start_date} - {booking.end_date}
                </p>
              </div>
              <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                {booking.status}
              </span>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="text-xs text-ink/60">
                Total: €{booking.grand_total}
              </div>
              {booking.status === "COMPLETED" ? (
                <ReviewForm
                  bookingId={booking.id}
                  listingId={booking.listing_id}
                  revieweeId={booking.listings?.owner_id ?? ""}
                />
              ) : null}
            </div>
          </div>
        ))}
        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60">
            No trips yet. Book a listing to see it here.
          </div>
        ) : null}
      </div>
    </div>
  );
}

