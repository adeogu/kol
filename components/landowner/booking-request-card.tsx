"use client";

import { useState } from "react";
import Link from "next/link";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { Booking } from "@/types";
import { StartConversationButton } from "@/components/shared/start-conversation-button";

type Props = {
  booking: Booking & { listing_title?: string; hunter_name?: string };
  currentUserId: string;
  licenseSnapshot?: {
    license_number: string | null;
    holder_name: string | null;
    license_type: string | null;
    county: string | null;
    expiry_date: string | null;
    status: string;
    license_document_url: string | null;
  } | null;
};

export function BookingRequestCard({
  booking,
  currentUserId,
  licenseSnapshot,
}: Props) {
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
    <div className="rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_12px_30px_rgba(17,18,15,0.08)] sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-ink sm:text-sm">
            {booking.listing_title ?? "Booking request"}
          </p>
          <p className="text-sm text-ink/60 sm:text-xs">
            Hunter: {booking.hunter_name ?? "Hunter"}
          </p>
          <p className="text-sm text-ink/60 sm:text-xs">
            {booking.start_date} - {booking.end_date}
          </p>
        </div>
        <span className="rounded-full bg-forest/10 px-2 py-1 text-sm font-semibold text-forest sm:text-xs">
          {status}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={loading || status !== "PENDING" || !isOnline}
          onClick={() => updateStatus("CONFIRMED")}
          className="min-h-[42px] rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 sm:text-xs"
        >
          Accept
        </button>
        <button
          disabled={loading || status !== "PENDING" || !isOnline}
          onClick={() => updateStatus("CANCELLED")}
          className="min-h-[42px] rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 disabled:opacity-50 sm:text-xs"
        >
          Decline
        </button>
        {currentUserId ? (
          <StartConversationButton
            listingId={booking.listing_id}
            hunterId={booking.hunter_id}
            landownerId={currentUserId}
            label="Message hunter"
            className="min-h-[42px] rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-forest hover:text-forest disabled:opacity-60 sm:text-xs"
          />
        ) : null}
      </div>
      <div className="mt-4 rounded-2xl border border-ink/10 bg-ink/5 p-3 text-sm text-ink/70 sm:text-xs">
        <p className="font-semibold text-ink">Hunter license snapshot</p>
        {licenseSnapshot ? (
          <div className="mt-2 space-y-1">
            <p>Status: {licenseSnapshot.status}</p>
            <p>Holder: {licenseSnapshot.holder_name ?? "Not captured"}</p>
            <p>Number: {licenseSnapshot.license_number ?? "Not captured"}</p>
            <p>Type: {licenseSnapshot.license_type ?? "Not captured"}</p>
            <p>County: {licenseSnapshot.county ?? "Not captured"}</p>
            <p>Expiry: {licenseSnapshot.expiry_date ?? "Not captured"}</p>
            {licenseSnapshot.license_document_url ? (
              <p>
                Document copy:{" "}
                <Link
                  href={licenseSnapshot.license_document_url}
                  target="_blank"
                  className="font-semibold text-forest underline"
                >
                  Open uploaded file
                </Link>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-ink/60">
            No snapshot stored yet for this booking.
          </p>
        )}
      </div>
      {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
