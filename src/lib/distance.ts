export interface Coordinates {
  latitude: number;
  longitude: number;
}

export function calculateDistance(from: Coordinates, to: Coordinates): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const earthRadiusMeters = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }

  const distanceKm = distanceMeters / 1000;
  return `${distanceKm.toFixed(1).replace('.', ',')} km`;
}
