import type { LatLng } from './types';

/**
 * École 42 Paris (96 boulevard Bessières, 17e) : le quartier de référence du projet, affiché quand la carte n'a
 * rien d'autre à montrer : ni action, ni brouillon, ni quartier connu de l'utilisateur (`home` de NeighborhoodMap).
 */
export const DEFAULT_CENTER: LatLng = [48.8966, 2.3183];
export const DEFAULT_ZOOM = 14;
/** Zoom d'une action ou de la position de l'utilisateur. */
export const FOCUS_ZOOM = 16;
/** Marge (px) autour des pins quand la carte s'ajuste aux actions visibles. */
export const FIT_PADDING: [number, number] = [48, 48];

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/** Paramètre d'URL de la carte : action à sélectionner à l'arrivée (`/map?focus=<id>`), posé par créer/modifier. */
export const FOCUS_PARAM = 'focus';
