"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import {
  filterSeedPois,
  type PoiBounds,
  type PoiCategory,
  type PointOfInterest,
} from "@/lib/poi";
import { formatCoordinateValue, parseCoordinateValue } from "@/lib/geo";
import type { Listing } from "@/types";

type Props = {
  listings: Listing[];
  poiCategories?: PoiCategory[];
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
  poiCount?: number;
  poiSource?: "seed" | "overpass";
  poiLoading?: boolean;
  userLocationKnown?: boolean;
  locationStatus?: "idle" | "locating" | "ready" | "denied" | "unavailable";
};

const markerIcon = L.divIcon({
  className: "huntstay-marker",
  html: "<div style='width:14px;height:14px;border-radius:999px;background:#1f3a2a;box-shadow:0 0 0 4px rgba(31,58,42,0.2)'></div>",
});

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const mapTiles = mapboxToken
  ? {
      url: `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
      attribution:
        "&copy; <a href=\"https://www.mapbox.com/about/maps/\">Mapbox</a> &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a>",
    }
  : {
      url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      attribution:
        "&copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors &copy; <a href=\"https://www.carto.com/\">CARTO</a>",
    };

export default function MapViewClient({ listings, poiCategories, onDebug }: Props) {
  const mapId = useId().replace(/:/g, "");
  const debugRef = useRef<string | null>(null);
  const initialCenter = useMemo(() => [53.3, -8.0] as [number, number], []);
  const [mapState, setMapState] = useState<MapDebugInfo["mapState"] | null>(null);
  const [bounds, setBounds] = useState<PoiBounds | null>(null);
  const [poiMarkers, setPoiMarkers] = useState<PointOfInterest[]>([]);
  const [poiSource, setPoiSource] = useState<"seed" | "overpass">("seed");
  const [poiLoading, setPoiLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationStatus, setLocationStatus] = useState<
    "idle" | "locating" | "ready" | "denied" | "unavailable"
  >("idle");
  const mapRef = useRef<L.Map | null>(null);
  const locateTimeoutRef = useRef<number | null>(null);

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

  const activeCategories = useMemo<PoiCategory[]>(
    () =>
      poiCategories && poiCategories.length > 0
        ? poiCategories
        : (["restaurant", "hotel", "motel", "sightseeing", "hunting_store"] as PoiCategory[]),
    [poiCategories],
  );
  const categoriesKey = useMemo(
    () => [...activeCategories].sort().join(","),
    [activeCategories],
  );

  const fallbackPois = useMemo(
    () => filterSeedPois(activeCategories, bounds),
    [activeCategories, bounds],
  );

  useEffect(() => {
    setPoiMarkers(fallbackPois);
    setPoiSource("seed");
  }, [fallbackPois]);

  useEffect(() => {
    if (!bounds) return;

    let active = true;
    const timeout = window.setTimeout(async () => {
      try {
        if (!active) return;
        setPoiLoading(true);
        const params = new URLSearchParams({
          south: String(bounds.south),
          west: String(bounds.west),
          north: String(bounds.north),
          east: String(bounds.east),
          categories: categoriesKey,
        });

        const response = await fetch(`/api/poi/search?${params.toString()}`, {
          cache: "no-store",
        });
        if (!active) return;
        if (!response.ok) {
          throw new Error("POI request failed.");
        }

        const payload = (await response.json()) as {
          pois?: PointOfInterest[];
          source?: "seed" | "overpass";
        };
        if (!active) return;

        const pois = Array.isArray(payload.pois) ? payload.pois : [];
        setPoiMarkers(pois.length > 0 ? pois : fallbackPois);
        setPoiSource(payload.source === "overpass" ? "overpass" : "seed");
      } catch {
        if (!active) return;
        setPoiMarkers(fallbackPois);
        setPoiSource("seed");
      } finally {
        if (active) {
          setPoiLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [bounds, categoriesKey, fallbackPois]);

  const poiColorMap: Record<PoiCategory, string> = {
    restaurant: "#2f8f5b",
    hotel: "#3f6c52",
    motel: "#5c8069",
    sightseeing: "#6b8f3e",
    hunting_store: "#1f4a2f",
  };

  const debugInfo = useMemo<MapDebugInfo>(
    () => ({
      totalListings: listings.length,
      markerCount: markers.length,
      poiCount: poiMarkers.length,
      poiSource,
      poiLoading,
      userLocationKnown: Boolean(userLocation),
      locationStatus,
      mapState: mapState ?? undefined,
      sample: listings.slice(0, 5).map((listing) => ({
        id: listing.id,
        title: listing.title,
        postalCode: listing.postal_code ?? null,
        raw: formatCoordinateValue(listing.coordinates).slice(0, 160),
      })),
    }),
    [
      listings,
      markers.length,
      poiMarkers.length,
      poiSource,
      poiLoading,
      mapState,
      userLocation,
      locationStatus,
    ],
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

  useEffect(() => {
    return () => {
      if (locateTimeoutRef.current !== null) {
        window.clearTimeout(locateTimeoutRef.current);
        locateTimeoutRef.current = null;
      }
    };
  }, []);

  const clearLocateTimeout = () => {
    if (locateTimeoutRef.current !== null) {
      window.clearTimeout(locateTimeoutRef.current);
      locateTimeoutRef.current = null;
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    if (!mapRef.current) return;
    setLocationStatus("locating");
    clearLocateTimeout();
    locateTimeoutRef.current = window.setTimeout(() => {
      setLocationStatus("unavailable");
    }, 12000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearLocateTimeout();
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setLocationStatus("ready");
        mapRef.current?.setView(
          [location.lat, location.lng],
          Math.max(mapRef.current.getZoom(), 13),
        );
      },
      (error) => {
        clearLocateTimeout();
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus("denied");
          return;
        }
        setLocationStatus("unavailable");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-ink/10">
      <MapContainer
        id={mapId}
        key={mapId}
        center={initialCenter}
        zoom={7}
        minZoom={6}
        maxZoom={16}
        scrollWheelZoom
        dragging
        doubleClickZoom
        touchZoom
        keyboard
        className="h-full w-full"
      >
        <MapStateReporter
          markers={markers}
          onBoundsChange={setBounds}
          onState={setMapState}
          onMapReady={handleMapReady}
        />
        <TileLayer attribution={mapTiles.attribution} url={mapTiles.url} />

        {markers.map((item) => (
          <Marker
            key={item.listing.id}
            position={[item.coords!.lat, item.coords!.lng]}
            icon={markerIcon}
          >
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">{item.listing.title}</p>
                <p className="text-xs text-ink/70">{item.listing.county}</p>
                <p className="text-xs font-semibold text-forest">
                  EUR {item.listing.price_per_day}/day
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {poiMarkers.map((poi) => (
          <CircleMarker
            key={poi.id}
            center={[poi.lat, poi.lng]}
            radius={4}
            pathOptions={{
              color: poiColorMap[poi.category],
              weight: 1.5,
              fillColor: poiColorMap[poi.category],
              fillOpacity: 0.55,
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">{poi.name}</p>
                <p className="text-xs uppercase text-ink/60">
                  {poi.category.replace("_", " ")}
                </p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">
                  {poi.source === "overpass" ? "live nearby" : "seed data"}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {userLocation ? (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pathOptions={{
              color: "#0f3f26",
              weight: 2,
              fillColor: "#4f8a5c",
              fillOpacity: 0.8,
            }}
          >
            <Popup>
              <p className="text-sm font-semibold text-ink">Your location</p>
            </Popup>
          </CircleMarker>
        ) : null}
      </MapContainer>
      <button
        type="button"
        onClick={locateMe}
        className="absolute right-3 top-3 z-[500] rounded-full border border-ink/15 bg-white/95 px-3 py-2 text-xs font-semibold text-ink shadow"
      >
        {locationStatus === "locating"
          ? "Locating..."
          : locationStatus === "ready"
            ? "Re-center me"
            : "Locate me"}
      </button>
    </div>
  );
}

function mapStateSnapshot(map: ReturnType<typeof useMap>) {
  return {
    dragging: map.dragging.enabled(),
    scrollWheelZoom: map.scrollWheelZoom.enabled(),
    touchZoom: map.touchZoom.enabled(),
    doubleClickZoom: map.doubleClickZoom.enabled(),
    keyboard: map.keyboard.enabled(),
  };
}

function mapBoundsSnapshot(map: ReturnType<typeof useMap>): PoiBounds {
  const b = map.getBounds();
  return {
    south: b.getSouth(),
    west: b.getWest(),
    north: b.getNorth(),
    east: b.getEast(),
  };
}

function MapStateReporter({
  onState,
  onBoundsChange,
  onMapReady,
  markers,
}: {
  onState: (state: MapDebugInfo["mapState"] | null) => void;
  onBoundsChange: (bounds: PoiBounds) => void;
  onMapReady: (map: L.Map) => void;
  markers: Array<{ coords: { lat: number; lng: number } | null }>;
}) {
  const map = useMap();
  const centeredRef = useRef(false);

  useMapEvents({
    moveend: () => {
      onBoundsChange(mapBoundsSnapshot(map));
      onState(mapStateSnapshot(map));
    },
    zoomend: () => {
      onBoundsChange(mapBoundsSnapshot(map));
      onState(mapStateSnapshot(map));
    },
  });

  useEffect(() => {
    onMapReady(map);
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.keyboard.enable();
    onState(mapStateSnapshot(map));
    onBoundsChange(mapBoundsSnapshot(map));
  }, [map, onBoundsChange, onMapReady, onState]);

  useEffect(() => {
    if (centeredRef.current || markers.length === 0) return;
    const points = markers
      .map((marker) => marker.coords)
      .filter((value): value is { lat: number; lng: number } => Boolean(value))
      .map((coord) => [coord.lat, coord.lng] as [number, number]);

    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], Math.max(map.getZoom(), 11));
    } else {
      map.fitBounds(points, { padding: [28, 28], maxZoom: 11 });
    }

    centeredRef.current = true;
    onBoundsChange(mapBoundsSnapshot(map));
    onState(mapStateSnapshot(map));
  }, [map, markers, onBoundsChange, onState]);

  return null;
}
