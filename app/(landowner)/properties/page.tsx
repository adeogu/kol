import Link from "next/link";
import { DeleteListingButton } from "@/components/landowner/delete-listing-button";
import { getPrimaryImageUrl } from "@/lib/listings";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Listing } from "@/types";

export default async function PropertiesPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("owner_id", user?.id ?? "");

  const listings = (data as Listing[]) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
            Properties
          </p>
          <h1 className="section-title text-3xl font-semibold text-ink">
            Manage your listings
          </h1>
        </div>
        <Link
          href="/properties/new"
          className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-forest/30 transition hover:bg-pine"
        >
          Add new property
        </Link>
      </div>
      <div className="grid items-stretch gap-4 md:grid-cols-2">
        {listings.map((listing) => {
          const image = getPrimaryImageUrl(listing.images);
          return (
            <div
              key={listing.id}
              className="flex h-full min-w-0 flex-col rounded-3xl border border-ink/10 bg-white p-6"
            >
              <div className="flex items-start gap-4">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-2xl bg-forest/10 md:w-28">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-semibold text-ink"
                        style={{ overflowWrap: "anywhere" }}
                      >
                        {listing.title}
                      </p>
                      <p
                        className="text-xs text-ink/60"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {listing.county}
                      </p>
                    </div>
                    <span className="shrink-0 whitespace-nowrap rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
                      {listing.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-ink/60">
                    EUR {listing.price_per_day}/day
                  </p>
                  <div className="mt-3 flex gap-3">
                    <Link
                      href={`/properties/${listing.id}/edit`}
                      className="text-xs font-semibold text-forest"
                    >
                      Edit listing
                    </Link>
                    <DeleteListingButton
                      listingId={listing.id}
                      title={listing.title}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {listings?.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60">
            No properties yet. Add your first listing.
          </div>
        ) : null}
      </div>
    </div>
  );
}
