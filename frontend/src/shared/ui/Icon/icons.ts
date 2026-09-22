// Icônes trait 24×24 (DESIGN.md §8) : fragments SVG statiques, rendus par <Icon>.
// Sources : sprite de ../mockup/index.html, complétées pour la navigation.
export const ICONS = {
  home: '<path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5ZM9 3v16M15 5v16"/>',
  leaf: '<path d="M20 3C7 2 2 8 6 15s16 2 14-12ZM4 21 16 9M9 16v-5"/>',
  heart: '<path d="M20.5 5.5a5 5 0 0 0-8.5 2 5 5 0 0 0-8.5-2c-4 5 2.5 10 8.5 15 6-5 12.5-10 8.5-15Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6m0 3h.01"/>',
  target: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/>',
  users: '<circle cx="9" cy="8" r="3"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 4 5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/>',
} as const;

export type IconName = keyof typeof ICONS;
