import { LandownerNav } from "@/components/landowner/landowner-nav";
import { requireRole } from "@/lib/auth";

export default async function LandownerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("LANDOWNER");
  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-6 pt-6">
        <LandownerNav />
      </div>
      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        {children}
      </main>
    </div>
  );
}
