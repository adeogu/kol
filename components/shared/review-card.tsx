type Review = {
  rating: number;
  comment: string | null;
  reviewer?: string | null;
};

export function ReviewCard({ rating, comment, reviewer }: Review) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">
          {reviewer ?? "Verified hunter"}
        </p>
        <p className="text-xs text-forest">{rating} / 5</p>
      </div>
      {comment ? <p className="mt-2 text-sm text-ink/70">{comment}</p> : null}
    </div>
  );
}
