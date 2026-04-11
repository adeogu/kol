import { ReviewForm } from "@/components/hunter/review-form";
import { StartConversationButton } from "@/components/shared/start-conversation-button";
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
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          My trips
        </p>
        <h1 className="section-title text-2xl font-semibold text-ink sm:text-3xl">
          Manage your hunting bookings
        </h1>
      </div>
      <div className="grid gap-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="rounded-2xl border border-ink/10 bg-white p-4 sm:rounded-3xl sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-ink sm:text-sm">
                  {booking.listings?.title ?? "Listing"}
                </p>
                <p className="text-sm text-ink/60 sm:text-xs">
                  {booking.start_date} - {booking.end_date}
                </p>
              </div>
              <span className="rounded-full bg-forest/10 px-3 py-1 text-sm font-semibold text-forest sm:text-xs">
                {booking.status}
              </span>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="text-sm text-ink/60 sm:text-xs">Total: EUR {booking.grand_total}</div>
                {booking.listings?.owner_id ? (
                  <StartConversationButton
                    listingId={booking.listing_id}
                    hunterId={booking.hunter_id}
                    landownerId={booking.listings.owner_id}
                    label="Message landowner"
                    className="min-h-[42px] rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-forest hover:text-forest disabled:opacity-60 sm:text-xs"
                  />
                ) : null}
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
          <div className="rounded-2xl border border-ink/10 bg-white p-5 text-sm text-ink/60 sm:rounded-3xl sm:p-6">
            No trips yet. Book a listing to see it here.
          </div>
        ) : null}
      </div>
    </div>
  );
}
