import Link from "next/link";
import { BookingModalButton } from "@/components/hunter/booking-modal";
import { getPrimaryImageUrl } from "@/lib/listings";
import type { Listing } from "@/types";

type Props = {
  listing: Listing;
  showBook?: boolean;
};

export function ListingCard({ listing, showBook = false }: Props) {
  const image = getPrimaryImageUrl(listing.images);
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_15px_30px_rgba(17,18,15,0.08)]"
    >
      <div className="h-36 w-full bg-forest/10">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-start gap-2">
          <p
            className="text-sm font-semibold text-ink"
            style={{ overflowWrap: "anywhere" }}
          >
            {listing.title}
          </p>
          <span className="rounded-full bg-forest/10 px-2 py-1 text-xs font-semibold text-forest">
            €{listing.price_per_day}/day
          </span>
        </div>
        <p className="text-xs text-ink/60">{listing.county}</p>
        <p
          className="text-xs text-ink/60"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {listing.allowed_animals?.slice(0, 3).join(", ")}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3">
          <Link
            href={`/discover/${listing.id}`}
            className="text-xs font-semibold text-forest"
          >
            View details
          </Link>
          {showBook ? <BookingModalButton listing={listing} /> : null}
        </div>
      </div>
    </div>
  );
}
