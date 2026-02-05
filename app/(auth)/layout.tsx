import { SiteHeader } from "@/components/shared/site-header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-6 pb-16 pt-8">
        {children}
      </main>
    </div>
  );
}
