export type PoiCategory =
  | "restaurant"
  | "hotel"
  | "motel"
  | "sightseeing"
  | "hunting_store";

export type PoiBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type PointOfInterest = {
  id: string;
  name: string;
  category: PoiCategory;
  lat: number;
  lng: number;
  source?: "seed" | "overpass";
};

export const POI_CATEGORIES: Array<{ value: PoiCategory; label: string }> = [
  { value: "restaurant", label: "Restaurants" },
  { value: "hotel", label: "Hotels" },
  { value: "motel", label: "Motels" },
  { value: "sightseeing", label: "Sightseeing" },
  { value: "hunting_store", label: "Hunting stores" },
];

// Starter POI seed list for dashboard overlay.
export const POI_DATA: PointOfInterest[] = [
  {
    id: "poi-athlone-rest-1",
    name: "Athlone Riverside Bistro",
    category: "restaurant",
    lat: 53.4239,
    lng: -7.9407,
  },
  {
    id: "poi-athlone-hotel-1",
    name: "Lough Ree Hotel",
    category: "hotel",
    lat: 53.4104,
    lng: -7.9258,
  },
  {
    id: "poi-athlone-motel-1",
    name: "Midlands Lodge",
    category: "motel",
    lat: 53.4362,
    lng: -7.9553,
  },
  {
    id: "poi-galway-sight-1",
    name: "Galway Bay Viewpoint",
    category: "sightseeing",
    lat: 53.2681,
    lng: -9.0504,
  },
  {
    id: "poi-galway-hunt-1",
    name: "Connacht Field Sports",
    category: "hunting_store",
    lat: 53.2756,
    lng: -9.0478,
  },
  {
    id: "poi-cork-rest-1",
    name: "Cork Harbour Kitchen",
    category: "restaurant",
    lat: 51.8986,
    lng: -8.4756,
  },
  {
    id: "poi-cork-hotel-1",
    name: "Lee Valley Hotel",
    category: "hotel",
    lat: 51.9049,
    lng: -8.4688,
  },
  {
    id: "poi-kerry-sight-1",
    name: "Killarney Lookout",
    category: "sightseeing",
    lat: 52.0599,
    lng: -9.5044,
  },
  {
    id: "poi-kerry-hunt-1",
    name: "Ring of Kerry Outdoors",
    category: "hunting_store",
    lat: 52.0587,
    lng: -9.5103,
  },
  {
    id: "poi-dublin-rest-1",
    name: "Dublin Quay Grill",
    category: "restaurant",
    lat: 53.3495,
    lng: -6.2603,
  },
  {
    id: "poi-dublin-hotel-1",
    name: "Liffey City Hotel",
    category: "hotel",
    lat: 53.3477,
    lng: -6.2654,
  },
];

export function isPointInsideBounds(point: PointOfInterest, bounds: PoiBounds) {
  return (
    point.lat >= bounds.south &&
    point.lat <= bounds.north &&
    point.lng >= bounds.west &&
    point.lng <= bounds.east
  );
}

export function filterSeedPois(
  categories: PoiCategory[],
  bounds?: PoiBounds | null,
) {
  return POI_DATA.filter((poi) => {
    if (!categories.includes(poi.category)) return false;
    if (!bounds) return true;
    return isPointInsideBounds(poi, bounds);
  }).map((poi) => ({ ...poi, source: "seed" as const }));
}

function queryForCategory(category: PoiCategory, bounds: PoiBounds) {
  const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
  if (category === "restaurant") {
    return [`nwr["amenity"="restaurant"](${bbox});`];
  }
  if (category === "hotel") {
    return [`nwr["tourism"="hotel"](${bbox});`];
  }
  if (category === "motel") {
    return [`nwr["tourism"="motel"](${bbox});`];
  }
  if (category === "sightseeing") {
    return [
      `nwr["tourism"="attraction"](${bbox});`,
      `nwr["tourism"="viewpoint"](${bbox});`,
      `nwr["tourism"="museum"](${bbox});`,
      `nwr["historic"](${bbox});`,
    ];
  }

  return [
    `nwr["shop"="outdoor"](${bbox});`,
    `nwr["shop"="sports"](${bbox});`,
    `nwr["shop"="hunting"](${bbox});`,
    `nwr["shop"="gun"](${bbox});`,
  ];
}

export function buildOverpassPoiQuery(
  categories: PoiCategory[],
  bounds: PoiBounds,
  perCategoryLimit = 120,
) {
  const lines = categories.flatMap((category) =>
    queryForCategory(category, bounds),
  );
  return [
    "[out:json][timeout:20];",
    "(",
    ...lines,
    ");",
    `out center ${perCategoryLimit};`,
  ].join("\n");
}

export function inferPoiCategory(
  categoryHint: PoiCategory[],
  tags: Record<string, string> | undefined,
): PoiCategory | null {
  const amenity = tags?.amenity?.toLowerCase();
  if (amenity === "restaurant" && categoryHint.includes("restaurant")) {
    return "restaurant";
  }

  const tourism = tags?.tourism?.toLowerCase();
  if (tourism === "hotel" && categoryHint.includes("hotel")) {
    return "hotel";
  }
  if (tourism === "motel" && categoryHint.includes("motel")) {
    return "motel";
  }
  if (
    tourism &&
    ["attraction", "viewpoint", "museum", "gallery", "picnic_site"].includes(
      tourism,
    ) &&
    categoryHint.includes("sightseeing")
  ) {
    return "sightseeing";
  }

  const historic = tags?.historic?.toLowerCase();
  if (historic && categoryHint.includes("sightseeing")) {
    return "sightseeing";
  }

  const shop = tags?.shop?.toLowerCase();
  if (
    shop &&
    ["outdoor", "sports", "hunting", "gun", "fishing", "camping"].includes(shop)
  ) {
    return categoryHint.includes("hunting_store") ? "hunting_store" : null;
  }

  return null;
}

export function defaultPoiName(category: PoiCategory) {
  if (category === "restaurant") return "Restaurant";
  if (category === "hotel") return "Hotel";
  if (category === "motel") return "Motel";
  if (category === "sightseeing") return "Sightseeing spot";
  return "Outdoor store";
}
