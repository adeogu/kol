"use client";

import { useId, useState } from "react";
import { BookingPanel } from "@/components/hunter/booking-panel";
import type { Listing } from "@/types";

type Props = {
  listing: Listing;
  label?: string;
};

export function BookingModalButton({ listing, label = "Book" }: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-forest px-3 py-1 text-xs font-semibold text-forest transition hover:bg-forest hover:text-white"
      >
        {label}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[280px] rounded-3xl border border-ink/10 bg-white p-5 shadow-[0_20px_60px_rgba(17,18,15,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-forest/70">
                  Booking
                </p>
                <p
                  id={titleId}
                  className="mt-1 text-sm font-semibold text-ink"
                >
                  {listing.title}
                </p>
                <p className="text-xs text-ink/60">{listing.county}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold text-ink/70 transition hover:border-ink/30"
              >
                Close
              </button>
            </div>
            <div className="mt-4">
              <BookingPanel listing={listing} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
