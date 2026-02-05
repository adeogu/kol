import { BookingRequestCard } from "@/components/landowner/booking-request-card";
import { EarningsChart } from "@/components/landowner/earnings-chart";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Booking } from "@/types";

export async function LandownerDashboard() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("owner_id", user?.id ?? "");

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, listings(title)")
    .in(
      "listing_id",
      listings?.map((listing) => listing.id) ?? [],
    )
    .limit(20);

  const pending = (bookings ?? []).filter((item) => item.status === "PENDING");

  const totalEarnings = (bookings ?? []).reduce((sum, booking) => {
    if (booking.status === "COMPLETED") {
      return sum + Number(booking.total_price ?? 0);
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[1fr_1fr]">
        <EarningsChart total={totalEarnings} />
        <div className="rounded-3xl border border-ink/10 bg-white p-6">
          <p className="text-sm font-semibold text-ink">Property overview</p>
          <div className="mt-4 space-y-3 text-sm text-ink/70">
            <p>Total listings: {listings?.length ?? 0}</p>
            <p>Pending bookings: {pending.length}</p>
            <p>Active listings: {listings?.filter((item) => item.status === "PUBLISHED").length ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">
            Pending booking requests
          </p>
          <p className="text-xs text-ink/60">{pending.length} waiting</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {pending.length === 0 ? (
            <div className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60">
              No pending requests. New bookings will appear here.
            </div>
          ) : null}
          {pending.map((booking) => (
            <BookingRequestCard
              key={booking.id}
              booking={{
                ...(booking as Booking),
                listing_title: booking.listings?.title,
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

