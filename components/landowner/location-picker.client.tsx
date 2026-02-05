"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { LatLng } from "@/lib/geo";

type Props = {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  center?: LatLng | null;
};

const markerIcon = L.divIcon({
  className: "huntstay-marker",
  html: "<div style='width:14px;height:14px;border-radius:999px;background:#1f3a2a;box-shadow:0 0 0 4px rgba(31,58,42,0.2)'></div>",
});

function ClickHandler({ onSelect }: { onSelect: (value: LatLng) => void }) {
  useMapEvents({
    click(event) {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function MapReady({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

export default function LocationPickerClient({
  value,
  onChange,
  center,
}: Props) {
  const mapId = useId().replace(/:/g, "");
  const mapRef = useRef<L.Map | null>(null);
  const mapCenter = useMemo(
    () => center ?? value ?? { lat: 53.3, lng: -8.0 },
    [center, value],
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
    if (!mapRef.current || !value) return;
    mapRef.current.setView([value.lat, value.lng], Math.max(13, mapRef.current.getZoom()));
  }, [value]);

  return (
    <div className="h-[320px] w-full overflow-hidden rounded-3xl border border-ink/10">
      <MapContainer
        id={mapId}
        key={mapId}
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={value ? 13 : 7}
        scrollWheelZoom
        dragging
        doubleClickZoom
        touchZoom
        keyboard
        className="h-full w-full"
      >
        <MapReady
          onReady={(map) => {
            mapRef.current = map;
            map.dragging.enable();
            map.scrollWheelZoom.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.keyboard.enable();
          }}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={onChange} />
        {value ? (
          <Marker
            position={[value.lat, value.lng]}
            icon={markerIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker;
                const point = marker.getLatLng();
                onChange({ lat: point.lat, lng: point.lng });
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
