import { BookingPanel } from "@/components/hunter/booking-panel";
import { ListingActions } from "@/components/hunter/listing-actions";
import { ReviewCard } from "@/components/shared/review-card";
import { normalizeImages } from "@/lib/listings";
import { createServerSupabase } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("listing_id", id)
    .limit(6);

  if (!listing) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-white p-8 text-sm text-ink/60">
        Listing not found.
      </div>
    );
  }

  const images = normalizeImages(listing.images);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="relative h-56 w-full overflow-hidden rounded-3xl bg-forest/10">
          {images[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0].url}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-ink/60">
              No photos uploaded yet.
            </div>
          )}
        </div>
        {images.length > 1 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {images.slice(1, 4).map((image) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={image.url}
                src={image.url}
                alt={listing.title}
                className="h-28 w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="rounded-3xl border border-ink/10 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
            {listing.county}
          </p>
          <h1 className="section-title text-3xl font-semibold text-ink">
            {listing.title}
          </h1>
          <p className="mt-2 text-sm text-ink/60">{listing.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-ink/70">
            <span className="rounded-full bg-forest/10 px-3 py-1">
              â‚¬{listing.price_per_day}/day
            </span>
            {listing.postal_code ? (
              <span className="rounded-full bg-forest/10 px-3 py-1">
                {listing.postal_code}
              </span>
            ) : null}
            <span className="rounded-full bg-forest/10 px-3 py-1">
              {listing.access_type}
            </span>
            <span className="rounded-full bg-forest/10 px-3 py-1">
              {listing.allowed_animals?.join(", ")}
            </span>
          </div>
          <div className="mt-6">
            <ListingActions
              listingId={listing.id}
              landownerId={listing.owner_id}
            />
          </div>
        </div>
        <div className="w-full lg:w-[220px]">
          <BookingPanel listing={listing} />
        </div>
      </div>

      <div className="rounded-3xl border border-ink/10 bg-white p-6">
        <p className="text-sm font-semibold text-ink">Rules</p>
        <p className="mt-2 text-sm text-ink/70">
          {listing.rules ?? "No special rules shared yet."}
        </p>
        <p className="mt-4 text-sm font-semibold text-ink">Amenities</p>
        <p className="mt-2 text-sm text-ink/70">
          {listing.amenities?.join(", ") || "No amenities listed."}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-ink">Recent reviews</p>
        <div className="grid gap-3 md:grid-cols-2">
          {(
            (reviews ?? []) as Array<{
              id: string;
              rating: number;
              comment: string | null;
            }>
          ).map((review) => (
            <ReviewCard
              key={review.id}
              rating={review.rating}
              comment={review.comment}
            />
          ))}
          {(reviews ?? []).length === 0 ? (
            <div className="rounded-2xl border border-ink/10 bg-white p-4 text-sm text-ink/60">
              No reviews yet.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
