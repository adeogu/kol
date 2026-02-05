"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Listing } from "@/types";
import {
  formatCoordinateValue,
  parseCoordinateValue,
} from "@/lib/geo";

type Props = {
  listings: Listing[];
  onDebug?: (info: MapDebugInfo) => void;
};

export type MapDebugInfo = {
  totalListings: number;
  markerCount: number;
  sample: Array<{
    id: string;
    title: string;
    postalCode?: string | null;
    raw: string;
  }>;
  mapState?: {
    dragging: boolean;
    scrollWheelZoom: boolean;
    touchZoom: boolean;
    doubleClickZoom: boolean;
    keyboard: boolean;
  };
};

const markerIcon = L.divIcon({
  className: "huntstay-marker",
  html: "<div style='width:14px;height:14px;border-radius:999px;background:#1f3a2a;box-shadow:0 0 0 4px rgba(31,58,42,0.2)'></div>",
});

export default function MapViewClient({
  listings,
  onDebug,
}: Props) {
  const mapId = useId().replace(/:/g, "");
  const debugRef = useRef<string | null>(null);
  const initialCenter = useMemo(
    () => [53.3, -8.0] as [number, number],
    [],
  );
  const [mapState, setMapState] = useState<MapDebugInfo["mapState"] | null>(
    null,
  );
  const markers = useMemo(
    () =>
      listings
        .map((listing) => ({
          listing,
          coords: parseCoordinateValue(listing.coordinates),
        }))
        .filter((item) => item.coords),
    [listings],
  );
  const debugInfo = useMemo<MapDebugInfo>(
    () => ({
      totalListings: listings.length,
      markerCount: markers.length,
      mapState: mapState ?? undefined,
      sample: listings.slice(0, 5).map((listing) => ({
        id: listing.id,
        title: listing.title,
        postalCode: listing.postal_code ?? null,
        raw: formatCoordinateValue(listing.coordinates).slice(0, 160),
      })),
    }),
    [listings, markers.length, mapState],
  );

  useEffect(() => {
    return () => {
      const container = document.getElementById(mapId);
      if (container && (container as { _leaflet_id?: number })._leaflet_id) {
        (container as { _leaflet_id?: number })._leaflet_id = undefined;
      }
    };
  }, [mapId]);

  useEffect(() => {
    if (!onDebug) return;
    const key = JSON.stringify(debugInfo);
    if (debugRef.current === key) return;
    debugRef.current = key;
    onDebug(debugInfo);
  }, [debugInfo, onDebug]);

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-3xl border border-ink/10">
      <MapContainer
        id={mapId}
        key={mapId}
        center={initialCenter}
        zoom={7}
        scrollWheelZoom
        dragging
        doubleClickZoom
        touchZoom
        keyboard
        className="h-full w-full"
      >
        <MapStateReporter onState={setMapState} markers={markers} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((item) => (
          <Marker
            key={item.listing.id}
            position={[item.coords!.lat, item.coords!.lng]}
            icon={markerIcon}
          >
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-semibold">{item.listing.title}</p>
                <p className="text-xs text-gray-600">{item.listing.county}</p>
                <p className="text-xs font-semibold text-forest">
                  €{item.listing.price_per_day}/day
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function MapStateReporter({
  onState,
  markers,
}: {
  onState: (state: MapDebugInfo["mapState"] | null) => void;
  markers: Array<{ coords: { lat: number; lng: number } | null }>;
}) {
  const map = useMap();
  const centeredRef = useRef(false);

  useEffect(() => {
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.keyboard.enable();
    if (!centeredRef.current && markers.length > 0 && markers[0].coords) {
      const first = markers[0].coords;
      map.setView([first.lat, first.lng], Math.max(map.getZoom(), 12));
      centeredRef.current = true;
    }
    onState({
      dragging: map.dragging.enabled(),
      scrollWheelZoom: map.scrollWheelZoom.enabled(),
      touchZoom: map.touchZoom.enabled(),
      doubleClickZoom: map.doubleClickZoom.enabled(),
      keyboard: map.keyboard.enabled(),
    });
  }, [map, markers, onState]);
  

  return null;
}
