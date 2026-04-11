"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { InboxBadge } from "@/components/shared/inbox-badge";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/properties", label: "Properties" },
  { href: "/bookings", label: "Bookings" },
  { href: "/calendar", label: "Calendar" },
  { href: "/messages", label: "Inbox" },
  { href: "/profile", label: "Profile" },
];

export function LandownerNav() {
  const pathname = usePathname();
  const isOnline = useOnlineStatus();
  const isActivePath = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname?.startsWith(href);

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 shadow-[0_12px_30px_rgba(17,18,15,0.08)] backdrop-blur sm:gap-4 sm:rounded-3xl sm:px-6 sm:py-4">
      <Link href="/dashboard" className="text-base font-semibold text-forest sm:text-sm">
        HuntStay
      </Link>
      <div className="order-3 flex w-full gap-2 overflow-x-auto pb-1 text-sm text-ink/70 sm:order-none sm:w-auto sm:flex-wrap sm:gap-3 sm:overflow-visible sm:pb-0">
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
            className={`shrink-0 rounded-full px-3 py-2 text-sm transition ${
              isActivePath(link.href)
                ? "bg-forest/12 text-forest"
                : "text-ink/70 hover:bg-forest/10 hover:text-forest"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {link.label}
              {link.href === "/messages" ? <InboxBadge /> : null}
            </span>
          </Link>
        ))}
      </div>
      {!isOnline ? (
        <p className="w-full text-xs text-amber-900 sm:w-auto">
          Offline mode: navigation is paused until reconnect.
        </p>
      ) : null}
    </nav>
  );
}
