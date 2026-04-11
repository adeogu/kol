import { NextResponse } from "next/server";
import {
  buildOverpassPoiQuery,
  defaultPoiName,
  filterSeedPois,
  inferPoiCategory,
  POI_CATEGORIES,
  type PoiBounds,
  type PoiCategory,
  type PointOfInterest,
} from "@/lib/poi";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const CACHE_TTL_MS = 3 * 60 * 1000;

const IRELAND_BOUNDS: PoiBounds = {
  south: 51.2,
  west: -11.0,
  north: 55.7,
  east: -5.0,
};

type CachedPayload = {
  expiresAt: number;
  payload: {
    pois: PointOfInterest[];
    source: "overpass" | "seed";
  };
};

const poiCache = new Map<string, CachedPayload>();

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function parseBoundValue(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBounds(searchParams: URLSearchParams): PoiBounds | null {
  const south = parseBoundValue(searchParams.get("south"));
  const west = parseBoundValue(searchParams.get("west"));
  const north = parseBoundValue(searchParams.get("north"));
  const east = parseBoundValue(searchParams.get("east"));

  if (
    south === null ||
    west === null ||
    north === null ||
    east === null ||
    south >= north ||
    west >= east
  ) {
    return null;
  }

  const clamped: PoiBounds = {
    south: Math.max(IRELAND_BOUNDS.south, south),
    west: Math.max(IRELAND_BOUNDS.west, west),
    north: Math.min(IRELAND_BOUNDS.north, north),
    east: Math.min(IRELAND_BOUNDS.east, east),
  };

  if (clamped.south >= clamped.north || clamped.west >= clamped.east) {
    return null;
  }

  return clamped;
}

function parseCategories(searchParams: URLSearchParams): PoiCategory[] {
  const raw = searchParams.get("categories");
  const requested = raw
    ? raw
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

  const valid = new Set(POI_CATEGORIES.map((item) => item.value));
  const parsed = requested.filter((item): item is PoiCategory => valid.has(item as PoiCategory));
  return parsed.length > 0 ? parsed : POI_CATEGORIES.map((item) => item.value);
}

function buildCacheKey(bounds: PoiBounds, categories: PoiCategory[]) {
  return [
    bounds.south.toFixed(2),
    bounds.west.toFixed(2),
    bounds.north.toFixed(2),
    bounds.east.toFixed(2),
    [...categories].sort().join(","),
  ].join("|");
}

function pointInBounds(lat: number, lng: number, bounds: PoiBounds) {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

function overpassElementPoint(element: OverpassElement) {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { lat: element.lat, lng: element.lon };
  }
  if (
    typeof element.center?.lat === "number" &&
    typeof element.center?.lon === "number"
  ) {
    return { lat: element.center.lat, lng: element.center.lon };
  }
  return null;
}

function fallbackPayload(bounds: PoiBounds, categories: PoiCategory[]) {
  return {
    pois: filterSeedPois(categories, bounds),
    source: "seed" as const,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bounds = parseBounds(searchParams);
  const categories = parseCategories(searchParams);

  if (!bounds) {
    return NextResponse.json(
      { error: "Invalid map bounds." },
      { status: 400 },
    );
  }

  const cacheKey = buildCacheKey(bounds, categories);
  const cached = poiCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload);
  }

  const query = buildOverpassPoiQuery(categories, bounds);
  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: query,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Overpass returned ${response.status}`);
    }

    const payload = (await response.json()) as { elements?: OverpassElement[] };
    const elements = Array.isArray(payload.elements) ? payload.elements : [];
    const poiLimitPerCategory = 80;
    const categoryCount: Record<PoiCategory, number> = {
      restaurant: 0,
      hotel: 0,
      motel: 0,
      sightseeing: 0,
      hunting_store: 0,
    };
    const dedupe = new Set<string>();
    const pois: PointOfInterest[] = [];

    for (const element of elements) {
      const point = overpassElementPoint(element);
      if (!point) continue;
      if (!pointInBounds(point.lat, point.lng, bounds)) continue;

      const category = inferPoiCategory(categories, element.tags);
      if (!category) continue;
      if (categoryCount[category] >= poiLimitPerCategory) continue;

      const dedupeKey = `${category}|${point.lat.toFixed(5)}|${point.lng.toFixed(
        5,
      )}|${element.tags?.name ?? ""}`;
      if (dedupe.has(dedupeKey)) continue;
      dedupe.add(dedupeKey);
      categoryCount[category] += 1;

      pois.push({
        id: `osm-${element.type}-${element.id}`,
        name: element.tags?.name?.trim() || defaultPoiName(category),
        category,
        lat: point.lat,
        lng: point.lng,
        source: "overpass",
      });
    }

    const normalized =
      pois.length > 0 ? pois : fallbackPayload(bounds, categories).pois;
    const result = {
      pois: normalized,
      source: (pois.length > 0 ? "overpass" : "seed") as "overpass" | "seed",
    };
    poiCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload: result,
    });
    return NextResponse.json(result);
  } catch {
    const fallback = fallbackPayload(bounds, categories);
    poiCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload: fallback,
    });
    return NextResponse.json(fallback);
  }
}
