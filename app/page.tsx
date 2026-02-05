import Link from "next/link";
import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

const highlights = [
  {
    title: "Verified landowners",
    body: "Identity checks, land verification, and transparent rules for every listing.",
  },
  {
    title: "Map-first discovery",
    body: "Explore counties, access types, and wildlife in one unified map view.",
  },
  {
    title: "Secure booking",
    body: "Instant confirmations, clear policies, and payments held in escrow.",
  },
];

const steps = [
  {
    label: "1",
    title: "Find land",
    body: "Browse Ireland by county, animal, price, or access type.",
  },
  {
    label: "2",
    title: "Book confidently",
    body: "Select dates, review rules, and confirm in minutes.",
  },
  {
    label: "3",
    title: "Hunt with trust",
    body: "Message landowners, get directions, and focus on the outing.",
  },
];

const trust = [
  {
    title: "Role-based experiences",
    body: "Separate dashboards for hunters and landowners keep each journey focused.",
  },
  {
    title: "Real-time messaging",
    body: "Built-in chat keeps everyone aligned before and after each hunt.",
  },
  {
    title: "Transparent reviews",
    body: "Reviews are tied to bookings for accountable feedback.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="px-6 pb-16">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 pb-16 pt-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
              Trusted hunting access in Ireland
            </p>
            <h1 className="section-title text-4xl font-semibold text-ink md:text-5xl">
              Book private hunting land with the confidence of a trusted
              marketplace.
            </h1>
            <p className="text-lg text-ink/70">
              HuntStay connects verified landowners and responsible hunters.
              Discover private land, reserve dates, and manage every trip from a
              role-specific dashboard.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-forest/30 transition hover:bg-pine"
              >
                Find hunting land
              </Link>
              <Link
                href="/register"
                className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink/70 transition hover:border-forest hover:text-forest"
              >
                List your land
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-ink/60">
              <div>
                <p className="text-2xl font-semibold text-ink">120+</p>
                <p>Counties covered</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink">98%</p>
                <p>Verified listings</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-ink">24/7</p>
                <p>Support response</p>
              </div>
            </div>
          </div>
          <div className="grain relative overflow-hidden rounded-3xl border border-ink/10 bg-mist p-6 shadow-[0_30px_70px_rgba(17,18,15,0.2)]">
            <div className="rounded-2xl bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
                Live booking preview
              </p>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-ink/10 bg-ink/5 p-4">
                  <p className="text-sm font-semibold text-ink">
                    County Wicklow Estate
                  </p>
                  <p className="text-xs text-ink/60">
                    Deer, pheasant, guided access
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink/70">
                    <span>Dec 18 - Dec 20</span>
                    <span className="rounded-full bg-forest px-2 py-1 text-white">
                      Confirmed
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-white p-4">
                  <p className="text-sm font-semibold text-ink">
                    Landowner notes
                  </p>
                  <p className="text-xs text-ink/60">
                    Gate access code sent. Parking beside the barn.
                  </p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-forest/10 p-4">
                  <p className="text-sm font-semibold text-forest">
                    Next best match
                  </p>
                  <p className="text-xs text-ink/60">
                    County Kerry, €90/day, river access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto w-full max-w-6xl space-y-6 pb-16"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
                Platform highlights
              </p>
              <h2 className="section-title text-3xl font-semibold text-ink">
                Built for Irish hunters and landowners.
              </h2>
            </div>
            <Link
              href="/register"
              className="rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink/70 transition hover:border-forest hover:text-forest"
            >
              Start onboarding
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_18px_40px_rgba(17,18,15,0.12)]"
              >
                <p className="text-sm font-semibold text-forest">
                  {feature.title}
                </p>
                <p className="mt-3 text-sm text-ink/70">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto w-full max-w-6xl space-y-6 pb-16"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
              How it works
            </p>
            <h2 className="section-title text-3xl font-semibold text-ink">
              A seamless booking flow for every role.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.title} className="rounded-3xl bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">
                  {step.label}
                </div>
                <p className="mt-4 text-lg font-semibold text-ink">
                  {step.title}
                </p>
                <p className="mt-2 text-sm text-ink/70">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="trust"
          className="mx-auto grid w-full max-w-6xl gap-8 rounded-3xl border border-ink/10 bg-white p-8 md:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
              Trust and safety
            </p>
            <h2 className="section-title text-3xl font-semibold text-ink">
              Verified, review-backed, and protected by design.
            </h2>
            <p className="text-sm text-ink/70">
              HuntStay keeps your data secure with Supabase RLS, real-time
              messaging, and booking-backed reviews. Payments are held until
              hunts are confirmed.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-clay px-6 py-3 text-sm font-semibold text-white transition hover:bg-forest"
              >
                Become verified
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink/70 transition hover:border-forest hover:text-forest"
              >
                View dashboard demo
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            {trust.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-ink/10 bg-mist p-5"
              >
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-2 text-sm text-ink/70">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="mx-auto w-full max-w-6xl space-y-6 pb-16 pt-16"
        >
          <div className="rounded-3xl border border-ink/10 bg-forest p-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                  Transparent pricing
                </p>
                <h2 className="section-title text-3xl font-semibold text-white">
                  Pay per booking. No subscriptions.
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  Hunters pay a simple service fee per booking. Landowners keep
                  full control over daily rates.
                </p>
              </div>
              <Link
                href="/register"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-mist"
              >
                Get started today
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
