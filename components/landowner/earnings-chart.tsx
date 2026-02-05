type Props = {
  total: number;
};

export function EarningsChart({ total }: Props) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6">
      <p className="text-sm font-semibold text-ink">Earnings this month</p>
      <p className="mt-4 text-3xl font-semibold text-forest">€{total}</p>
      <div className="mt-6 h-24 rounded-2xl bg-forest/10" />
      <p className="mt-3 text-xs text-ink/60">
        Stripe payouts processed weekly once bookings are completed.
      </p>
    </div>
  );
}
