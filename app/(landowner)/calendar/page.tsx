import { AvailabilityCalendar } from "@/components/landowner/availability-calendar";
import { createServerSupabase } from "@/lib/supabase/server";

const toKey = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default async function CalendarPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id,start_date,end_date,status,listings!inner(title,owner_id)")
    .eq("listings.owner_id", user?.id ?? "")
    .neq("status", "CANCELLED")
    .order("start_date", { ascending: false });

  const dateKeys = new Set<string>();
  (bookings ?? []).forEach((booking) => {
    if (!booking.start_date || !booking.end_date) return;
    let current = new Date(`${booking.start_date}T00:00:00`);
    const end = new Date(`${booking.end_date}T00:00:00`);
    while (current <= end) {
      dateKeys.add(toKey(current));
      current = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() + 1,
      );
    }
  });

  const calendarBookings =
    bookings?.map((booking) => ({
      id: booking.id,
      listingTitle: booking.listings?.title ?? null,
      startDate: booking.start_date,
      endDate: booking.end_date,
      status: booking.status,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Availability
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Manage your booking calendar
        </h1>
      </div>
      <AvailabilityCalendar
        bookedDates={Array.from(dateKeys)}
        bookings={calendarBookings}
      />
    </div>
  );
}
