import type { LatLng } from './types';

/** Paramètre d'URL `?at=lat,lng` : le lieu d'un brouillon survit à la connexion et au rechargement. */
export const DRAFT_PARAM = 'at';

const PRECISION = 5; // ~1 m

export const formatDraft = ([latitude, longitude]: LatLng): string =>
  `${latitude.toFixed(PRECISION)},${longitude.toFixed(PRECISION)}`;

export const parseDraft = (value: string | null): LatLng | null => {
  if (value === null) return null;
  const [latitude, longitude] = value.split(',').map(Number);
  if (latitude === undefined || longitude === undefined) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return [latitude, longitude];
};
