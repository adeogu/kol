import { BookingRequestCard } from "@/components/landowner/booking-request-card";
import { EarningsChart } from "@/components/landowner/earnings-chart";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Booking, Listing } from "@/types";

export async function LandownerDashboard() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listingsData } = await supabase
    .from("listings")
    .select("*")
    .eq("owner_id", user?.id ?? "");

  const listings = (listingsData as Listing[]) ?? [];

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("*, listings(title)")
    .in(
      "listing_id",
      listings.map((listing) => listing.id),
    )
    .limit(20);

  const bookings =
    (bookingsData as Array<
      Booking & { listings?: { title?: string | null } | null }
    >) ?? [];

  const pending = bookings.filter((item) => item.status === "PENDING");
  const pendingIds = pending.map((booking) => booking.id);
  const pendingHunterIds = Array.from(
    new Set(pending.map((booking) => booking.hunter_id)),
  );

  const { data: pendingHuntersData } =
    pendingHunterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", pendingHunterIds)
      : {
          data: [] as Array<{
            id: string;
            first_name: string | null;
            last_name: string | null;
          }>,
        };

  const { data: pendingSnapshotsData } =
    pendingIds.length > 0
      ? await supabase
          .from("booking_license_snapshots")
          .select(
            "booking_id, license_number, holder_name, license_type, county, expiry_date, status, license_document_url",
          )
          .in("booking_id", pendingIds)
      : {
          data: [] as Array<{
            booking_id: string;
            license_number: string | null;
            holder_name: string | null;
            license_type: string | null;
            county: string | null;
            expiry_date: string | null;
            status: string;
            license_document_url: string | null;
          }>,
        };

  const pendingHuntersById = new Map(
    ((pendingHuntersData ?? []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
    }>).map((hunter) => [hunter.id, hunter]),
  );
  const pendingSnapshotsByBookingId = new Map(
    ((pendingSnapshotsData ?? []) as Array<{
      booking_id: string;
      license_number: string | null;
      holder_name: string | null;
      license_type: string | null;
      county: string | null;
      expiry_date: string | null;
      status: string;
      license_document_url: string | null;
    }>).map((snapshot) => [snapshot.booking_id, snapshot]),
  );
  const pendingCards = pending.map((booking) => {
    const hunter = pendingHuntersById.get(booking.hunter_id);
    const hunterName =
      [hunter?.first_name, hunter?.last_name].filter(Boolean).join(" ") ||
      undefined;
    const snapshot = pendingSnapshotsByBookingId.get(booking.id);
    return {
      booking,
      hunterName,
      snapshot,
    };
  });

  const totalEarnings = bookings.reduce((sum, booking) => {
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
            <p>Total listings: {listings.length}</p>
            <p>Pending bookings: {pending.length}</p>
            <p>Active listings: {listings.filter((item) => item.status === "PUBLISHED").length}</p>
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
          {pendingCards.map(({ booking, hunterName, snapshot }) => (
            <BookingRequestCard
              key={booking.id}
              currentUserId={user?.id ?? ""}
              booking={{
                ...(booking as Booking),
                listing_title: booking.listings?.title ?? undefined,
                hunter_name: hunterName,
              }}
              licenseSnapshot={
                snapshot
                  ? {
                      license_number: snapshot.license_number,
                      holder_name: snapshot.holder_name,
                      license_type: snapshot.license_type,
                      county: snapshot.county,
                      expiry_date: snapshot.expiry_date,
                      status: snapshot.status,
                      license_document_url: snapshot.license_document_url,
                    }
                  : null
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

