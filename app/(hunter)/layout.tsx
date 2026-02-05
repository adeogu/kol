import { HunterNav } from "@/components/hunter/hunter-nav";
import { requireRole } from "@/lib/auth";

export default async function HunterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("HUNTER");
  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-6 pt-6">
        <HunterNav />
      </div>
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        {children}
      </main>
    </div>
  );
}
