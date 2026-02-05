import { HunterDashboardClient } from "@/components/hunter/hunter-dashboard-client";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Listing } from "@/types";

export async function HunterDashboard() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "PUBLISHED")
    .order("created_at", { ascending: false })
    .limit(200);

  const listings = (data ?? []) as Listing[];

  return (
    <HunterDashboardClient
      listings={listings}
      debugError={error?.message ?? null}
    />
  );
}

