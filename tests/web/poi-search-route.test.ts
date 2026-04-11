import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/poi/search/route";

const base =
  "http://localhost/api/poi/search?south=53.2&west=-8.2&north=53.6&east=-7.7";

describe("poi search route", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 400 for invalid bounds", async () => {
    const response = await GET(
      new Request("http://localhost/api/poi/search?south=53&west=-8"),
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when any bounds are non-numeric", async () => {
    const response = await GET(
      new Request("http://localhost/api/poi/search?south=abc&west=-8&north=53.6&east=-7.7"),
    );
    expect(response.status).toBe(400);
  });

  it("returns 400 when clamped bounds become invalid", async () => {
    const response = await GET(
      new Request("http://localhost/api/poi/search?south=60&west=-8&north=61&east=-7"),
    );
    expect(response.status).toBe(400);
  });

  it("falls back to seed data when upstream is non-2xx", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const response = await GET(
      new Request(`${base}&categories=restaurant,invalid`),
    );
    const payload = (await response.json()) as {
      source: "seed" | "overpass";
      pois: Array<{ category: string; source?: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.source).toBe("seed");
    expect(payload.pois.length).toBeGreaterThan(0);
    expect(payload.pois.every((poi) => poi.category === "restaurant")).toBe(true);
  });

  it("returns overpass data when upstream resolves", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        elements: [
          {
            id: 1,
            type: "node",
            lat: 53.35,
            lon: -8.0,
            tags: { amenity: "restaurant", name: "Field Kitchen" },
          },
          {
            id: 2,
            type: "way",
            center: { lat: 53.34, lon: -8.01 },
            tags: { tourism: "hotel" },
          },
          {
            id: 3,
            type: "node",
            lat: 52.0,
            lon: -8.01,
            tags: { amenity: "restaurant", name: "Out of range" },
          },
          {
            id: 4,
            type: "node",
            lat: 53.35,
            lon: -8.0,
            tags: { amenity: "restaurant", name: "Field Kitchen" },
          },
          {
            id: 5,
            type: "relation",
            tags: { amenity: "restaurant", name: "Missing coord" },
          },
        ],
      }),
    });

    const response = await GET(
      new Request(`${base}&categories=restaurant,hotel`),
    );
    const payload = (await response.json()) as {
      source: "seed" | "overpass";
      pois: Array<{ name: string; category: string; source?: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.source).toBe("overpass");
    expect(payload.pois.length).toBe(2);
    expect(payload.pois.some((poi) => poi.name === "Field Kitchen")).toBe(true);
    expect(payload.pois.some((poi) => poi.name === "Hotel")).toBe(true);
    expect(payload.pois.every((poi) => poi.source === "overpass")).toBe(true);
  });

  it("falls back to seed when upstream returns no usable elements", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ elements: [{ id: 10, type: "node", lat: 53.3, lon: -8.0 }] }),
    });

    const response = await GET(new Request(`${base}&categories=sightseeing`));
    const payload = (await response.json()) as {
      source: "seed" | "overpass";
      pois: Array<{ source?: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.source).toBe("seed");
    expect(payload.pois.every((poi) => poi.source === "seed")).toBe(true);
  });

  it("falls back to seed when upstream response has no elements array", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const response = await GET(
      new Request(
        "http://localhost/api/poi/search?south=51.7&west=-10.0&north=52.2&east=-9.0&categories=restaurant",
      ),
    );
    const payload = (await response.json()) as {
      source: "seed" | "overpass";
      pois: unknown[];
    };

    expect(response.status).toBe(200);
    expect(payload.source).toBe("seed");
    expect(Array.isArray(payload.pois)).toBe(true);
  });

  it("serves from cache for repeated same request", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        elements: [
          {
            id: 999,
            type: "node",
            lat: 52.36,
            lon: -8.2,
            tags: { amenity: "restaurant", name: "Cached Place" },
          },
        ],
      }),
    });

    const requestUrl =
      "http://localhost/api/poi/search?south=52.2&west=-8.8&north=52.8&east=-8.1&categories=restaurant";
    const first = await GET(new Request(requestUrl));
    const second = await GET(new Request(requestUrl));
    const firstPayload = (await first.json()) as { source: string };
    const secondPayload = (await second.json()) as { source: string };

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(firstPayload.source).toBe("overpass");
    expect(secondPayload.source).toBe("overpass");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to seed when fetch throws", async () => {
    fetchMock.mockRejectedValue(new Error("network"));

    const response = await GET(
      new Request(
        "http://localhost/api/poi/search?south=51.2&west=-10.5&north=51.95&east=-8.0&categories=hotel",
      ),
    );
    const payload = (await response.json()) as {
      source: "seed" | "overpass";
      pois: Array<{ category: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.source).toBe("seed");
    expect(payload.pois.every((poi) => poi.category === "hotel")).toBe(true);
  });

  it("caps overpass POIs per category at 80", async () => {
    const elements = Array.from({ length: 82 }).map((_, index) => ({
      id: 2000 + index,
      type: "node" as const,
      lat: 53.35 + index * 0.00001,
      lon: -8.0,
      tags: { amenity: "restaurant", name: `R-${index}` },
    }));

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ elements }),
    });

    const response = await GET(
      new Request(
        "http://localhost/api/poi/search?south=53.2&west=-8.2&north=53.8&east=-7.7&categories=restaurant",
      ),
    );
    const payload = (await response.json()) as {
      source: "seed" | "overpass";
      pois: Array<{ category: string }>;
    };

    expect(response.status).toBe(200);
    expect(payload.source).toBe("overpass");
    expect(payload.pois).toHaveLength(80);
    expect(payload.pois.every((poi) => poi.category === "restaurant")).toBe(true);
  });
});
