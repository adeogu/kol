export type ListingImage = {
  url: string;
  order?: number;
  caption?: string;
};

export function normalizeImages(value: unknown): ListingImage[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter(Boolean) as ListingImage[];
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed as ListingImage[];
      }
    } catch {
      return [];
    }
  }
  return [];
}

export function getPrimaryImageUrl(value: unknown) {
  return normalizeImages(value)[0]?.url;
}
