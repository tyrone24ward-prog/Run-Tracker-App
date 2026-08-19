export interface Coord {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: Coord, b: Coord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isUsefulFix(options: {
  accuracy: number | null;
  distanceMeters: number;
  dtMs: number;
}): boolean {
  const { accuracy, distanceMeters, dtMs } = options;
  if (accuracy != null && accuracy > 35) return false;
  if (dtMs < 400) return false;
  if (distanceMeters < 0.8) return false;
  const speed = distanceMeters / (dtMs / 1000);
  if (speed > 12.5) return false;
  return true;
}

export function strideLengthMeters(heightCm: number): number {
  const heightM = Math.max(120, heightCm) / 100;
  return heightM * 0.43;
}
