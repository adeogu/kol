export type LatLng = {
  lat: number;
  lng: number;
};

const parseWkbPointHex = (value: string) => {
  const hex = value.trim();
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length < 18) return null;
  const byteLength = hex.length / 2;
  if (!Number.isInteger(byteLength)) return null;
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  const view = new DataView(bytes.buffer);
  const little = view.getUint8(0) === 1;
  let offset = 1;
  const type = view.getUint32(offset, little);
  offset += 4;
  const hasSrid = (type & 0x20000000) !== 0;
  const hasZ = (type & 0x80000000) !== 0;
  const hasM = (type & 0x40000000) !== 0;
  if (hasSrid) {
    offset += 4;
  }
  const baseType = type & 0x000000ff;
  if (baseType !== 1) return null;
  const lng = view.getFloat64(offset, little);
  offset += 8;
  const lat = view.getFloat64(offset, little);
  if (hasZ) offset += 8;
  if (hasM) offset += 8;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
};

export const parseCoordinateValue = (value: unknown): LatLng | null => {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("SRID=")) {
      const parts = trimmed.split(";");
      if (parts.length > 1) {
        return parseCoordinateValue(parts.slice(1).join(";"));
      }
    }
    if (trimmed.startsWith("POINT")) {
      const coords = trimmed
        .replace("POINT(", "")
        .replace(")", "")
        .trim()
        .split(/\s+/);
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return { lat, lng };
      }
    }
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as {
          coordinates?: [number, number];
          type?: string;
        };
        if (Array.isArray(parsed.coordinates)) {
          return { lng: parsed.coordinates[0], lat: parsed.coordinates[1] };
        }
      } catch {
        // ignore invalid JSON
      }
    }
    const wkbPoint = parseWkbPointHex(trimmed);
    if (wkbPoint) return wkbPoint;
  }
  if (Array.isArray(value) && value.length >= 2) {
    const [lng, lat] = value;
    if (typeof lat === "number" && typeof lng === "number") {
      return { lat, lng };
    }
  }
  if (typeof value === "object") {
    const maybe = value as {
      coordinates?: [number, number];
      lat?: number;
      lng?: number;
      latitude?: number;
      longitude?: number;
      type?: string;
    };
    if (Array.isArray(maybe.coordinates)) {
      return { lng: maybe.coordinates[0], lat: maybe.coordinates[1] };
    }
    if (typeof maybe.lat === "number" && typeof maybe.lng === "number") {
      return { lat: maybe.lat, lng: maybe.lng };
    }
    if (
      typeof maybe.latitude === "number" &&
      typeof maybe.longitude === "number"
    ) {
      return { lat: maybe.latitude, lng: maybe.longitude };
    }
  }
  return null;
};

export const formatCoordinateValue = (value: unknown) => {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value ?? "");
  }
};
