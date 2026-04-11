import { HunterNav } from "@/components/hunter/hunter-nav";
import { LandownerNav } from "@/components/landowner/landowner-nav";
import { redirect } from "next/navigation";
import { getProfile, requireUser } from "@/lib/auth";

export default async function SharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  const profile = await getProfile();
  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }
  const isLandowner = profile?.role === "LANDOWNER";
  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 sm:pt-6">
        {isLandowner ? <LandownerNav /> : <HunterNav />}
      </div>
      <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pb-16 sm:pt-8">
        {children}
      </main>
    </div>
  );
}
