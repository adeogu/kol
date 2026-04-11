"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  bookingId: string;
  listingId: string;
  revieweeId: string;
};

export function ReviewForm({ bookingId, listingId, revieweeId }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submitReview = async () => {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("reviews").insert({
      booking_id: bookingId,
      listing_id: listingId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment,
    });
    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success sm:text-xs">
        Review submitted. Thank you!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink sm:text-xs">Leave a review</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`h-9 w-9 rounded-full text-sm font-semibold sm:h-8 sm:w-8 sm:text-xs ${
              rating >= value
                ? "bg-forest text-white"
                : "border border-ink/15 text-ink/60"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        className="field w-full rounded-xl px-3 py-2 text-base sm:text-xs"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Share your experience"
      />
      <button
        type="button"
        onClick={submitReview}
        disabled={loading}
        className="min-h-[42px] rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:text-xs"
      >
        {loading ? "Submitting..." : "Submit review"}
      </button>
    </div>
  );
}
