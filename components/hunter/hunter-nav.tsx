"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { InboxBadge } from "@/components/shared/inbox-badge";

const links = [
  { href: "/dashboard", label: "Discover" },
  { href: "/trips", label: "My Trips" },
  { href: "/saved", label: "Saved" },
  { href: "/messages", label: "Messages" },
  { href: "/profile", label: "Profile" },
];

export function HunterNav() {
  const pathname = usePathname();
  const isOnline = useOnlineStatus();

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-ink/10 bg-white/80 px-6 py-4 shadow-[0_12px_30px_rgba(17,18,15,0.08)] backdrop-blur">
      <Link href="/dashboard" className="text-sm font-semibold text-forest">
        HuntStay
      </Link>
      <div className="flex flex-wrap gap-3 text-sm text-ink/70">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={(event) => {
              if (!isOnline && pathname !== link.href) {
                event.preventDefault();
              }
            }}
            title={
              !isOnline && pathname !== link.href
                ? "Offline mode: stay on this page until connection returns."
                : undefined
            }
            className="rounded-full px-3 py-1 transition hover:bg-forest/10 hover:text-forest"
          >
            <span className="inline-flex items-center gap-2">
              {link.label}
              {link.href === "/messages" ? <InboxBadge /> : null}
            </span>
          </Link>
        ))}
      </div>
      {!isOnline ? (
        <p className="w-full text-xs text-amber-900 md:w-auto">
          Offline mode: navigation is paused until reconnect.
        </p>
      ) : null}
    </nav>
  );
}
