import { HunterDashboard } from "@/components/hunter/hunter-dashboard";
import { LandownerDashboard } from "@/components/landowner/landowner-dashboard";
import { getProfile, requireUser } from "@/lib/auth";

export default async function DashboardPage() {
  await requireUser();
  const profile = await getProfile();

  if (profile?.role === "LANDOWNER") {
    return <LandownerDashboard />;
  }

  return <HunterDashboard />;
}
