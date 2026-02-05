"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACCESS_TYPES, AMENITIES, ANIMALS, COUNTIES } from "@/lib/constants";
import { LocationPicker } from "@/components/landowner/location-picker";
import { parseCoordinateValue, type LatLng } from "@/lib/geo";
import { normalizeImages, type ListingImage } from "@/lib/listings";
import { createClient } from "@/lib/supabase/client";
import type { Listing } from "@/types";

type Props = {
  initial?: Partial<Listing>;
};

export function PropertyForm({ initial }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [county, setCounty] = useState(initial?.county ?? "");
  const [landSize, setLandSize] = useState(
    initial?.land_size?.toString() ?? "",
  );
  const [accessType, setAccessType] = useState<Listing["access_type"]>(
    initial?.access_type ?? "CAR",
  );
  const [animals, setAnimals] = useState<string[]>(
    initial?.allowed_animals ?? [],
  );
  const [amenities, setAmenities] = useState<string[]>(
    initial?.amenities ?? [],
  );
  const [price, setPrice] = useState(
    initial?.price_per_day?.toString() ?? "",
  );
  const [rules, setRules] = useState(initial?.rules ?? "");
  const [postalCode, setPostalCode] = useState(initial?.postal_code ?? "");
  const [pinLocation, setPinLocation] = useState<LatLng | null>(() =>
    parseCoordinateValue(initial?.coordinates),
  );
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [currentImages, setCurrentImages] = useState<ListingImage[]>(
    normalizeImages(initial?.images),
  );
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = (
    value: string,
    list: string[],
    setter: (v: string[]) => void,
  ) => {
    setter(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
    );
  };

  const geocodePostalCode = async () => {
    if (!postalCode.trim()) {
      setError("Please enter an Eircode for map placement.");
      return null;
    }
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      setError("Mapbox token is missing. Please add it to .env.local.");
      return null;
    }
    setGeocoding(true);
    try {
      const query = encodeURIComponent(postalCode.trim());
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?country=IE&limit=5&autocomplete=false&types=address,postcode&access_token=${mapboxToken}`;
      const geoResponse = await fetch(mapboxUrl);
      if (!geoResponse.ok) {
        setError("Unable to geocode Eircode.");
        return null;
      }

      const geoPayload = (await geoResponse.json()) as {
        features?: Array<{
          center: [number, number];
          place_name: string;
          place_type?: string[];
        }>;
      };
      if (!geoPayload?.features?.length) {
        setError("No location found for that Eircode.");
        return null;
      }

      const bestFeature =
        geoPayload.features.find((feature) =>
          feature.place_type?.includes("address"),
        ) ??
        geoPayload.features.find((feature) =>
          feature.place_type?.includes("postcode"),
        ) ??
        geoPayload.features[0];

      const [lng, lat] = bestFeature.center;
      return { lat: Number(lat), lng: Number(lng) };
    } catch {
      setError("Unable to geocode Eircode.");
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Please log in to continue.");
        return;
      }

      const uploadedImages: ListingImage[] = [];
      if (imageFiles && imageFiles.length > 0) {
        for (let index = 0; index < imageFiles.length; index += 1) {
          const file = imageFiles[index];
          const filePath = `${user.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("listing-images")
            .upload(filePath, file, { upsert: true });
          if (uploadError) {
            setError(uploadError.message);
            return;
          }
          const { data } = supabase.storage
            .from("listing-images")
            .getPublicUrl(filePath);
          uploadedImages.push({
            url: data.publicUrl,
            order: currentImages.length + index,
          });
        }
      }

      const mergedImages = [...currentImages, ...uploadedImages].map(
        (image, index) => ({
          ...image,
          order: index,
        }),
      );

      const selectedCoords =
        pinLocation ?? (await geocodePostalCode());
      if (!selectedCoords) {
        return;
      }
      if (!pinLocation) {
        setPinLocation(selectedCoords);
      }
      const coordinates = `POINT(${Number(selectedCoords.lng)} ${Number(
        selectedCoords.lat,
      )})`;

      const payload = {
        owner_id: user.id,
        title,
        description,
        location,
        county,
        postal_code: postalCode.trim(),
        coordinates,
        land_size: landSize ? Number(landSize) : null,
        access_type: accessType,
        allowed_animals: animals,
        price_per_day: Number(price),
        rules,
        amenities,
        images: mergedImages,
        status: "PUBLISHED",
        published_at: new Date().toISOString(),
      };

      if (initial?.id) {
        const { error: updateError } = await supabase
          .from("listings")
          .update(payload)
          .eq("id", initial.id);
        if (updateError) {
          setError(updateError.message);
          return;
        }
      } else {
        const { error: insertError } = await supabase
          .from("listings")
          .insert(payload);
        if (insertError) {
          setError(insertError.message);
          return;
        }
      }

      router.push("/properties");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border border-ink/10 bg-white p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-ink">Title</label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-ink">Description</label>
          <textarea
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">Location</label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">County</label>
          <select
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={county}
            onChange={(event) => setCounty(event.target.value)}
            required
          >
            <option value="">Select a county</option>
            {COUNTIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">
            Land size (acres)
          </label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={landSize}
            onChange={(event) => setLandSize(event.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">Access type</label>
          <select
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={accessType}
            onChange={(event) =>
              setAccessType(event.target.value as Listing["access_type"])
            }
          >
            {ACCESS_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-ink">Price per day</label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-semibold text-ink">
            Eircode / Postal code
          </label>
          <input
            className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            placeholder="e.g. D02 X285"
            required
          />
          <p className="mt-2 text-xs text-ink/60">
            We use your Eircode to place the property on the map.
          </p>
        </div>
        <div className="md:col-span-2 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-sm font-semibold text-ink">
              Pin exact location
            </label>
            <button
              type="button"
              onClick={async () => {
                setError(null);
                const coords = await geocodePostalCode();
                if (coords) {
                  setPinLocation(coords);
                }
              }}
              disabled={geocoding}
              className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold text-ink/70 transition hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-60"
            >
              {geocoding ? "Locating..." : "Find on map"}
            </button>
          </div>
          <p className="text-xs text-ink/60">
            Click the map to drop a pin, or drag the marker to refine the
            location.
          </p>
          <LocationPicker
            value={pinLocation}
            onChange={setPinLocation}
            center={pinLocation}
          />
          {pinLocation ? (
            <p className="text-xs text-ink/60">
              Pin: {pinLocation.lat.toFixed(5)}, {pinLocation.lng.toFixed(5)}
            </p>
          ) : (
            <p className="text-xs text-ink/50">
              No pin yet. Use “Find on map” or click the map.
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">
          Allowed animals
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {ANIMALS.map((animal) => (
            <button
              key={animal}
              type="button"
              onClick={() => toggleItem(animal, animals, setAnimals)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                animals.includes(animal)
                  ? "bg-forest text-white"
                  : "border border-ink/15 text-ink/70 hover:border-forest hover:text-forest"
              }`}
            >
              {animal}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">Amenities</label>
        <div className="mt-3 flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleItem(amenity, amenities, setAmenities)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                amenities.includes(amenity)
                  ? "bg-forest text-white"
                  : "border border-ink/15 text-ink/70 hover:border-forest hover:text-forest"
              }`}
            >
              {amenity}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">Rules</label>
        <textarea
          className="field mt-2 w-full rounded-xl px-4 py-3 text-sm"
          rows={3}
          value={rules ?? ""}
          onChange={(event) => setRules(event.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-ink">Images</label>
        <input
          type="file"
          multiple
          accept="image/*"
          className="mt-2 w-full text-sm text-ink/70"
          onChange={(event) => setImageFiles(event.target.files)}
        />
        {currentImages.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {currentImages.map((image) => (
              <div
                key={image.url}
                className="overflow-hidden rounded-2xl border border-ink/10 bg-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt="Listing"
                  className="h-32 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setCurrentImages((prev) =>
                      prev.filter((item) => item.url !== image.url),
                    )
                  }
                  className="w-full px-3 py-2 text-xs font-semibold text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-forest/30 transition hover:bg-pine disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Saving..." : initial?.id ? "Update listing" : "Create listing"}
      </button>
    </form>
  );
}
