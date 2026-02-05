"use client";

import { DayPicker } from "react-day-picker";

type BookingSummary = {
  id: string;
  listingTitle?: string | null;
  startDate: string;
  endDate: string;
  status: string;
};

type Props = {
  bookedDates: string[];
  bookings: BookingSummary[];
};

export function AvailabilityCalendar({ bookedDates, bookings }: Props) {
  const disabledDates = bookedDates.map(
    (date) => new Date(`${date}T00:00:00`),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-3xl border border-ink/10 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
              Booked dates
            </p>
            <p className="text-sm text-ink/60">
              Dates with confirmed or pending bookings are crossed out.
            </p>
          </div>
          <p className="text-xs font-semibold text-ink/60">
            {disabledDates.length} dates
          </p>
        </div>
        <div className="mt-4">
          <DayPicker
            mode="multiple"
            numberOfMonths={1}
            className="w-full"
            disabled={disabledDates}
          />
        </div>
      </div>
      <div className="rounded-3xl border border-ink/10 bg-white p-6">
        <p className="text-sm font-semibold text-ink">Recent bookings</p>
        <div className="mt-4 space-y-3 text-sm text-ink/70">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-2xl border border-ink/10 bg-mist p-4"
            >
              <p className="text-sm font-semibold text-ink">
                {booking.listingTitle ?? "Listing"}
              </p>
              <p className="text-xs text-ink/60">
                {booking.startDate} - {booking.endDate}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-forest/70">
                {booking.status}
              </p>
            </div>
          ))}
          {bookings.length === 0 ? (
            <p className="text-sm text-ink/60">No bookings yet.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
