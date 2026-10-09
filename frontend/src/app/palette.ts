// Exploration de direction artistique (branche explore/palettes) : quelle fiche de couleurs habille l'interface.
// `styles/tokens.css` porte un bloc `:root[data-palette='…']` par fiche ; sans attribut, la forêt + terracotta.
// Lu au démarrage (app/main.tsx) avant le premier rendu, changé par la bascule `layout/PaletteSwitch`.
// À retirer, avec la bascule, une fois la palette choisie.

export const PALETTES = ['forest', 'tropical', 'spring', 'seaside', 'retro'] as const;
export type Palette = (typeof PALETTES)[number];

const DEFAULT_PALETTE: Palette = 'forest';
const STORAGE_KEY = 'palette';
const URL_PARAM = 'palette';

const isPalette = (value: string | null): value is Palette =>
  value !== null && (PALETTES as readonly string[]).includes(value);

/** `?palette=tropical` dans l'URL (lien partageable), sinon le dernier choix (localStorage), sinon la forêt. */
export function readPalette(): Palette {
  const fromUrl = new URLSearchParams(window.location.search).get(URL_PARAM);
  if (isPalette(fromUrl)) return fromUrl;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isPalette(stored)) return stored;
  } catch {
    // Stockage indisponible (navigation privée stricte) : palette par défaut.
  }
  return DEFAULT_PALETTE;
}

/** Pose la palette sur <html> (le thème admin, posé par `data-theme`, garde la priorité) et la mémorise. */
export function applyPalette(palette: Palette): void {
  const root = document.documentElement;
  if (palette === DEFAULT_PALETTE) {
    delete root.dataset.palette;
  } else {
    root.dataset.palette = palette;
  }
  try {
    localStorage.setItem(STORAGE_KEY, palette);
  } catch {
    // Idem : le choix ne survivra pas au rechargement, l'interface reste utilisable.
  }
}
