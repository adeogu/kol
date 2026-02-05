"use client";

import { useCallback, useMemo, useState } from "react";
import { ListingCard } from "@/components/hunter/listing-card";
import { MapView } from "@/components/hunter/map-view";
import type { MapDebugInfo } from "@/components/hunter/map-view.client";
import { ACCESS_TYPES, ANIMALS, COUNTIES } from "@/lib/constants";
import type { Listing } from "@/types";

type Props = {
  listings: Listing[];
  debugError?: string | null;
};

export function HunterDashboardClient({ listings, debugError }: Props) {
  const [county, setCounty] = useState("");
  const [animals, setAnimals] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [accessType, setAccessType] = useState("");
  const [mapDebug, setMapDebug] = useState<MapDebugInfo | null>(null);

  const handleMapDebug = useCallback((info: MapDebugInfo) => {
    setMapDebug(info);
  }, []);


  const toggleAnimal = (animal: string) => {
    setAnimals((prev) =>
      prev.includes(animal)
        ? prev.filter((item) => item !== animal)
        : [...prev, animal],
    );
  };

  const filtered = useMemo(() => {
    return listings.filter((listing) => {
      if (county && listing.county !== county) return false;
      if (accessType && listing.access_type !== accessType) return false;
      if (animals.length > 0) {
        const hasAnimal = listing.allowed_animals?.some((animal) =>
          animals.includes(animal),
        );
        if (!hasAnimal) return false;
      }
      if (minPrice && listing.price_per_day < Number(minPrice)) return false;
      if (maxPrice && listing.price_per_day > Number(maxPrice)) return false;
      return true;
    });
  }, [listings, county, accessType, animals, minPrice, maxPrice]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-forest/70">
              Discover
            </p>
            <h1 className="section-title text-3xl font-semibold text-ink">
              Explore hunting land across Ireland
            </h1>
            <p className="text-sm text-ink/60">
              Pan the map, review listing details, and reserve your next hunt.
            </p>
          </div>
          <MapView
            listings={filtered}
            onDebug={handleMapDebug}
          />
        </div>
        <div className="space-y-4 rounded-3xl border border-ink/10 bg-white p-5">
          <p className="text-sm font-semibold text-ink">Filters</p>
          <div>
            <label className="text-xs font-semibold text-ink/70">County</label>
            <select
              className="field mt-2 w-full rounded-xl px-3 py-2 text-xs"
              value={county}
              onChange={(event) => setCounty(event.target.value)}
            >
              <option value="">All counties</option>
              {COUNTIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink/70">Animals</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ANIMALS.map((animal) => (
                <button
                  key={animal}
                  type="button"
                  onClick={() => toggleAnimal(animal)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                    animals.includes(animal)
                      ? "bg-forest text-white"
                      : "border border-ink/15 text-ink/60"
                  }`}
                >
                  {animal}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-ink/70">
                Min price
              </label>
              <input
                className="field mt-2 w-full rounded-xl px-3 py-2 text-xs"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink/70">
                Max price
              </label>
              <input
                className="field mt-2 w-full rounded-xl px-3 py-2 text-xs"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink/70">
              Access type
            </label>
            <select
              className="field mt-2 w-full rounded-xl px-3 py-2 text-xs"
              value={accessType}
              onChange={(event) => setAccessType(event.target.value)}
            >
              <option value="">Any</option>
              {ACCESS_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-ink/50">
            {filtered.length} properties found.
          </p>
          <details className="rounded-2xl border border-ink/10 bg-ink/5 px-3 py-2 text-[11px] text-ink/70">
            <summary className="cursor-pointer text-xs font-semibold text-ink">
              Debug panel
            </summary>
            <div className="mt-2 space-y-1">
              {debugError ? (
                <p className="text-danger">Query error: {debugError}</p>
              ) : null}
              <p>Total listings fetched: {listings.length}</p>
              <p>Listings after filters: {filtered.length}</p>
              <p>Markers on map: {mapDebug?.markerCount ?? 0}</p>
              {mapDebug?.mapState ? (
                <div className="text-xs text-ink/60">
                  <p>dragging: {mapDebug.mapState.dragging ? "on" : "off"}</p>
                  <p>
                    scroll zoom:{" "}
                    {mapDebug.mapState.scrollWheelZoom ? "on" : "off"}
                  </p>
                  <p>touch zoom: {mapDebug.mapState.touchZoom ? "on" : "off"}</p>
                  <p>
                    double click:{" "}
                    {mapDebug.mapState.doubleClickZoom ? "on" : "off"}
                  </p>
                  <p>keyboard: {mapDebug.mapState.keyboard ? "on" : "off"}</p>
                </div>
              ) : null}
              <p>
                Active filters:{" "}
                {[
                  county ? `county=${county}` : null,
                  accessType ? `access=${accessType}` : null,
                  animals.length > 0 ? `animals=${animals.length}` : null,
                  minPrice ? `min=${minPrice}` : null,
                  maxPrice ? `max=${maxPrice}` : null,
                ]
                  .filter(Boolean)
                  .join(", ") || "none"}
              </p>
            </div>
            {mapDebug?.sample?.length ? (
              <div className="mt-2 space-y-1">
                {mapDebug.sample.map((item) => (
                  <p key={item.id}>
                    {item.title} | {item.postalCode ?? "no postal"} | {item.raw}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-ink/50">No sample data yet.</p>
            )}
          </details>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Recommended listings</p>
          <p className="text-xs text-ink/60">{filtered.length} available</p>
        </div>
        <div className="grid items-stretch gap-4 md:grid-cols-2">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} showBook />
          ))}
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60">
              No matches. Adjust filters and try again.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
