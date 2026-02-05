"use client";

import dynamic from "next/dynamic";
import type { LatLng } from "@/lib/geo";

type Props = {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  center?: LatLng | null;
};

const LocationPickerClient = dynamic(
  () => import("./location-picker.client"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center rounded-3xl border border-ink/10 bg-white text-sm text-ink/60">
        Loading mapâ€¦
      </div>
    ),
  },
);

export function LocationPicker({ value, onChange, center }: Props) {
  return (
    <LocationPickerClient value={value} onChange={onChange} center={center} />
  );
}
