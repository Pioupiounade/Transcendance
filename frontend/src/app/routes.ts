import { AUTH_ROUTES } from '@/features/auth';

/** Tous les chemins de l'application, en un seul endroit. */
export const ROUTES = {
  home: '/',
  actions: '/actions',
  map: '/map',
  friends: '/friends',
  profile: '/profile',
  terms: '/terms',
  privacy: '/privacy',
  actionDetail: '/actions/:id',
  ...AUTH_ROUTES,
} as const;
