"use client";

import { useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import { format } from "date-fns";

type Props = {
  disabledDates?: Date[];
  maxRange?: number;
  confirmDisabled?: boolean;
  confirmDisabledReason?: string | null;
  onConfirm: (range: { from: Date; to: Date }) => void;
};

export function BookingCalendar({
  disabledDates = [],
  maxRange,
  confirmDisabled = false,
  confirmDisabledReason = null,
  onConfirm,
}: Props) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [error, setError] = useState<string | null>(null);
  const buttonLabel = confirmDisabled
    ? confirmDisabledReason
      ? "Requires internet"
      : "Processing..."
    : "Confirm dates";

  const handleConfirm = () => {
    if (confirmDisabled) {
      if (confirmDisabledReason) {
        setError(confirmDisabledReason);
      }
      return;
    }
    if (!range?.from || !range?.to) {
      setError("Select a start and end date.");
      return;
    }
    if (typeof maxRange === "number") {
      const diffDays =
        (range.to.getTime() - range.from.getTime()) /
          (1000 * 60 * 60 * 24) +
        1;
      if (diffDays > maxRange) {
        setError(`Maximum ${maxRange} days allowed.`);
        return;
      }
    }
    setError(null);
    onConfirm({ from: range.from, to: range.to });
  };

  return (
    <div className="space-y-4 rounded-3xl border border-ink/10 bg-white p-6">
      <p className="text-sm font-semibold text-ink">Choose your dates</p>
      <DayPicker
        mode="range"
        selected={range}
        onSelect={setRange}
        disabled={disabledDates}
        numberOfMonths={1}
        className="w-full"
      />
      {range?.from && range?.to ? (
        <p className="text-xs text-ink/60">
          {format(range.from, "MMM d, yyyy")} -{" "}
          {format(range.to, "MMM d, yyyy")}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={confirmDisabled}
        className="w-full rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-60"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
