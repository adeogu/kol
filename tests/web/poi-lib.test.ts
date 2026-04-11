import { describe, expect, it } from "vitest";
import {
  buildOverpassPoiQuery,
  defaultPoiName,
  filterSeedPois,
  inferPoiCategory,
  isPointInsideBounds,
  type PoiBounds,
} from "@/lib/poi";

const bounds: PoiBounds = {
  south: 53.2,
  west: -8.1,
  north: 53.5,
  east: -7.8,
};

describe("poi lib helpers", () => {
  it("checks whether point is inside bounds", () => {
    expect(
      isPointInsideBounds(
        {
          id: "p1",
          name: "x",
          category: "restaurant",
          lat: 53.3,
          lng: -8.0,
        },
        bounds,
      ),
    ).toBe(true);

    expect(
      isPointInsideBounds(
        {
          id: "p2",
          name: "x",
          category: "restaurant",
          lat: 52.0,
          lng: -8.0,
        },
        bounds,
      ),
    ).toBe(false);
  });

  it("filters seed POIs by categories and bounds", () => {
    const allRestaurants = filterSeedPois(["restaurant"]);
    expect(allRestaurants.length).toBeGreaterThan(0);
    expect(allRestaurants.every((poi) => poi.category === "restaurant")).toBe(true);
    expect(allRestaurants.every((poi) => poi.source === "seed")).toBe(true);

    const local = filterSeedPois(["restaurant", "hotel"], bounds);
    expect(local.length).toBeGreaterThan(0);
    expect(local.every((poi) => poi.lat >= bounds.south && poi.lat <= bounds.north)).toBe(
      true,
    );
  });

  it("builds overpass queries per category", () => {
    const query = buildOverpassPoiQuery(
      ["restaurant", "hotel", "motel", "sightseeing", "hunting_store"],
      bounds,
      90,
    );

    expect(query).toContain('[out:json][timeout:20];');
    expect(query).toContain('nwr["amenity"="restaurant"]');
    expect(query).toContain('nwr["tourism"="hotel"]');
    expect(query).toContain('nwr["tourism"="motel"]');
    expect(query).toContain('nwr["tourism"="attraction"]');
    expect(query).toContain('nwr["historic"]');
    expect(query).toContain('nwr["shop"="gun"]');
    expect(query).toContain("out center 90;");
  });

  it("infers categories from tags", () => {
    expect(inferPoiCategory(["restaurant"], { amenity: "restaurant" })).toBe(
      "restaurant",
    );
    expect(inferPoiCategory(["hotel"], { tourism: "hotel" })).toBe("hotel");
    expect(inferPoiCategory(["motel"], { tourism: "motel" })).toBe("motel");
    expect(
      inferPoiCategory(["sightseeing"], { tourism: "viewpoint" }),
    ).toBe("sightseeing");
    expect(inferPoiCategory(["sightseeing"], { historic: "castle" })).toBe(
      "sightseeing",
    );
    expect(inferPoiCategory(["hunting_store"], { shop: "outdoor" })).toBe(
      "hunting_store",
    );
    expect(inferPoiCategory(["restaurant"], { shop: "outdoor" })).toBe(null);
    expect(inferPoiCategory(["hotel"], undefined)).toBe(null);
  });

  it("returns default names for categories", () => {
    expect(defaultPoiName("restaurant")).toBe("Restaurant");
    expect(defaultPoiName("hotel")).toBe("Hotel");
    expect(defaultPoiName("motel")).toBe("Motel");
    expect(defaultPoiName("sightseeing")).toBe("Sightseeing spot");
    expect(defaultPoiName("hunting_store")).toBe("Outdoor store");
  });
});
