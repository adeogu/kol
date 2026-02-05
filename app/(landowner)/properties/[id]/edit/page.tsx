import { PropertyForm } from "@/components/landowner/property-form";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPropertyPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60">
        Please log in to edit listings.
      </div>
    );
  }

  const admin = createAdminSupabase();
  const { data: listing } = await admin
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!listing) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60">
        Listing not found.
      </div>
    );
  }

  if (listing.owner_id !== user.id) {
    return (
      <div className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60">
        You do not have access to edit this listing.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
          Edit listing
        </p>
        <h1 className="section-title text-3xl font-semibold text-ink">
          Update property details
        </h1>
      </div>
      <PropertyForm initial={listing} />
    </div>
  );
}
