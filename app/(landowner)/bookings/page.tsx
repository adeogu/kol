import { BookingRequestCard } from "@/components/landowner/booking-request-card";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Booking } from "@/types";

export default async function BookingsPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: listingsData } = await supabase
    .from("listings")
    .select("id, title")
    .eq("owner_id", user?.id ?? "");

  const listings =
    (listingsData as Array<{ id: string; title: string | null }>) ?? [];
  const listingIds = listings.map((listing) => listing.id);

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("*, listings(title)")
    .in("listing_id", listingIds)
    .order("created_at", { ascending: false });

  const bookings =
    (bookingsData as Array<
      Booking & { listings?: { title?: string | null } | null }
    >) ?? [];
  const bookingIds = bookings.map((booking) => booking.id);
  const hunterIds = Array.from(new Set(bookings.map((booking) => booking.hunter_id)));

  const { data: huntersData } =
    hunterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", hunterIds)
      : { data: [] as Array<{ id: string; first_name: string | null; last_name: string | null }> };

  const { data: snapshotsData } =
    bookingIds.length > 0
      ? await supabase
          .from("booking_license_snapshots")
          .select(
            "booking_id, license_number, holder_name, license_type, county, expiry_date, status, license_document_url",
          )
          .in("booking_id", bookingIds)
      : { data: [] as Array<{
          booking_id: string;
          license_number: string | null;
          holder_name: string | null;
          license_type: string | null;
          county: string | null;
          expiry_date: string | null;
          status: string;
          license_document_url: string | null;
        }> };

  const huntersById = new Map(
    ((huntersData ?? []) as Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
    }>).map((hunter) => [hunter.id, hunter]),
  );

  const snapshotsByBookingId = new Map(
    ((snapshotsData ?? []) as Array<{
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
  const bookingCards = bookings.map((booking) => {
    const hunter = huntersById.get(booking.hunter_id);
    const hunterName =
      [hunter?.first_name, hunter?.last_name].filter(Boolean).join(" ") ||
      undefined;
    const snapshot = snapshotsByBookingId.get(booking.id);
    return {
      booking,
      hunterName,
      snapshot,
    };
  });

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
        {bookingCards.map(({ booking, hunterName, snapshot }) => (
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
        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60">
            No bookings yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

