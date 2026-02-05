import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="px-6 py-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between rounded-full bg-white/80 px-6 py-3 shadow-[0_10px_30px_rgba(17,18,15,0.08)] backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-white">
            HS
          </span>
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] text-forest">
              HUNTSTAY
            </p>
            <p className="text-xs text-ink/70">Ireland hunting access</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink/70 md:flex">
          <Link href="/#how-it-works" className="hover:text-forest">
            How it works
          </Link>
          <Link href="/#trust" className="hover:text-forest">
            Trust
          </Link>
          <Link href="/#features" className="hover:text-forest">
            Features
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:border-forest hover:text-forest"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-forest/30 transition hover:bg-pine"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
