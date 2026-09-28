import type { LatLng } from './types';

const EARTH_RADIUS_M = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Distance à vol d'oiseau en mètres (haversine) entre deux `[lat, lng]`. */
export const distanceMeters = ([lat1, lng1]: LatLng, [lat2, lng2]: LatLng): number => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
};

/** « 350 m » sous le kilomètre (arrondi à 10 m), sinon « 1.2 km ». */
export const formatDistance = (meters: number): string =>
  meters < 1000 ? `${Math.max(10, Math.round(meters / 10) * 10)} m` : `${(meters / 1000).toFixed(1)} km`;
