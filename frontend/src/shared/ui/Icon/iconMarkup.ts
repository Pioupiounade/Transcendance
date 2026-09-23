import { ICONS, type IconName } from './icons';

/**
 * Même icône que `<Icon>`, en chaîne HTML, pour les endroits qui n'acceptent pas de React
 * (ex. `L.divIcon` de Leaflet). Décorative : `aria-hidden`.
 */
export const iconMarkup = (name: IconName, size = 20): string =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
