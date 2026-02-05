"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/types";
import type { MapDebugInfo } from "./map-view.client";

type Props = {
  listings: Listing[];
  onDebug?: (info: MapDebugInfo) => void;
};

const MapViewClient = dynamic(() => import("./map-view.client"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-3xl border border-ink/10 bg-white text-sm text-ink/60">
      Loading map…
    </div>
  ),
});

export function MapView({
  listings,
  onDebug,
}: Props) {
  return (
    <MapViewClient
      listings={listings}
      onDebug={onDebug}
    />
  );
}
