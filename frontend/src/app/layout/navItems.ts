import type { IconName } from '@/shared/ui';
import { APP_LABELS } from '../labels';
import { ROUTES } from '../routes';

export type NavItem = {
  to: string;
  label: string;
  icon: IconName;
  /** Correspondance exacte (accueil) plutôt que par préfixe. */
  end?: boolean;
  /** Entrée mise en avant au centre de la barre mobile. */
  primary?: boolean;
  /** Pas de case à elle dans la barre mobile (cinq cases) : Friends y vit dans le menu de la case Profile. */
  desktopOnly?: boolean;
};

// Une seule source pour l'en-tête desktop et la barre mobile.
export const NAV_ITEMS: readonly NavItem[] = [
  { to: ROUTES.home, label: APP_LABELS.nav.home, icon: 'home', end: true },
  { to: ROUTES.actions, label: APP_LABELS.nav.actions, icon: 'leaf' },
  { to: ROUTES.map, label: APP_LABELS.nav.map, icon: 'map', primary: true },
  { to: ROUTES.organizations, label: APP_LABELS.nav.organizations, icon: 'building' },
  { to: ROUTES.friends, label: APP_LABELS.nav.friends, icon: 'users', desktopOnly: true },
  { to: ROUTES.profile, label: APP_LABELS.nav.profile, icon: 'user' },
];
