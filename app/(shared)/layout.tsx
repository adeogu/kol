import { HunterNav } from "@/components/hunter/hunter-nav";
import { LandownerNav } from "@/components/landowner/landowner-nav";
import { getProfile, requireUser } from "@/lib/auth";

export default async function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getProfile();
  const isLandowner = profile?.role === "LANDOWNER";
  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-6 pt-6">
        {isLandowner ? <LandownerNav /> : <HunterNav />}
      </div>
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        {children}
      </main>
    </div>
  );
}
