import type { LatLng } from './types';

/** Saint-Cyprien, Toulouse : le quartier de la maquette, affiché quand il n'y a ni action ni position. */
export const DEFAULT_CENTER: LatLng = [43.5985, 1.4265];
export const DEFAULT_ZOOM = 14;
/** Zoom d'une action ou de la position de l'utilisateur. */
export const FOCUS_ZOOM = 16;
/** Marge (px) autour des pins quand la carte s'ajuste aux actions visibles. */
export const FIT_PADDING: [number, number] = [48, 48];

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

/** Paramètre d'URL de la carte : action à sélectionner à l'arrivée (`/map?focus=<id>`), posé par créer/modifier. */
export const FOCUS_PARAM = 'focus';
