"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Booking } from "@/types";

type Props = {
  booking: Booking & { listing_title?: string; hunter_name?: string };
};

export function BookingRequestCard({ booking }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(booking.status);

  const updateStatus = async (next: Booking["status"]) => {
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("bookings")
      .update({
        status: next,
        confirmed_at: next === "CONFIRMED" ? new Date().toISOString() : null,
        cancelled_at: next === "CANCELLED" ? new Date().toISOString() : null,
      })
      .eq("id", booking.id);
    setStatus(next);
    setLoading(false);
  };

  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_12px_30px_rgba(17,18,15,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">
            {booking.listing_title ?? "Booking request"}
          </p>
          <p className="text-xs text-ink/60">
            Hunter: {booking.hunter_name ?? "Hunter"}
          </p>
          <p className="text-xs text-ink/60">
            {booking.start_date} - {booking.end_date}
          </p>
        </div>
        <span className="rounded-full bg-forest/10 px-2 py-1 text-xs font-semibold text-forest">
          {status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={loading || status !== "PENDING"}
          onClick={() => updateStatus("CONFIRMED")}
          className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          Accept
        </button>
        <button
          disabled={loading || status !== "PENDING"}
          onClick={() => updateStatus("CANCELLED")}
          className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
