import { ListingCard } from "@/components/hunter/listing-card";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function SavedPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("favorites")
    .select("listings(*)")
    .eq("user_id", user?.id ?? "");

  const listings = data?.map((item) => item.listings).filter(Boolean) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Saved
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Your saved listings
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
        {listings.length === 0 ? (
          <div className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60">
            You have no saved listings yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

