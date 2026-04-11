export type PoiCategory =
  | "restaurant"
  | "hotel"
  | "motel"
  | "sightseeing"
  | "hunting_store";

export type PointOfInterest = {
  id: string;
  name: string;
  category: PoiCategory;
  lat: number;
  lng: number;
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
