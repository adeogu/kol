"use client";

import { useState } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { Booking } from "@/types";
import { StartConversationButton } from "@/components/shared/start-conversation-button";

type Props = {
  booking: Booking & { listing_title?: string; hunter_name?: string };
  currentUserId: string;
};

export function BookingRequestCard({ booking, currentUserId }: Props) {
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(booking.status);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (next: Booking["status"]) => {
    if (!isOnline) {
      setError("Reconnect to update booking status.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? "Unable to update booking.");
        return;
      }
      setStatus(next);
    } finally {
      setLoading(false);
    }
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
          disabled={loading || status !== "PENDING" || !isOnline}
          onClick={() => updateStatus("CONFIRMED")}
          className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
        >
          Accept
        </button>
        <button
          disabled={loading || status !== "PENDING" || !isOnline}
          onClick={() => updateStatus("CANCELLED")}
          className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 disabled:opacity-50"
        >
          Decline
        </button>
        {currentUserId ? (
          <StartConversationButton
            listingId={booking.listing_id}
            hunterId={booking.hunter_id}
            landownerId={currentUserId}
            label="Message hunter"
            className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 transition hover:border-forest hover:text-forest disabled:opacity-60"
          />
        ) : null}
      </div>
      {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
