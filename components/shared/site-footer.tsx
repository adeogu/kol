import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="px-6 pb-10 pt-16">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-ink/10 bg-white/70 p-8 backdrop-blur">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-forest">
              HUNTSTAY
            </p>
            <p className="mt-2 text-sm text-ink/70">
              The trusted marketplace for hunting access in Ireland.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-ink/70">
            <Link href="/#features" className="hover:text-forest">
              Features
            </Link>
            <Link href="/#trust" className="hover:text-forest">
              Trust
            </Link>
            <Link href="/#pricing" className="hover:text-forest">
              Pricing
            </Link>
            <Link href="/profile" className="hover:text-forest">
              Profile
            </Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 text-xs text-ink/50 md:flex-row md:items-center md:justify-between">
          <p>Built for landowners and hunters who value trust.</p>
          <p>© 2026 HuntStay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
