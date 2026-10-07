import { FOCUS_PARAM } from '@/features/actions';
import { AUTH_ROUTES } from '@/features/auth';

/** Tous les chemins de l'application, en un seul endroit. */
export const ROUTES = {
  home: '/',
  actions: '/actions',
  map: '/map',
  friends: '/friends',
  profile: '/profile',
  profileDetail: '/profile/:username',
  publicProfile: '/profiles/:userId',
  terms: '/terms',
  privacy: '/privacy',
  actionDetail: '/actions/:id',
  createAction: '/actions/new',
  editAction: '/actions/:id/edit',
  organizations: '/organizations',
  organization: '/organizations/:id',
  organizationManage: '/organizations/:id/manage',
  admin: '/admin',
  adminUsers: '/admin/users',
  ...AUTH_ROUTES,
} as const;

export const editActionPath = (id: string): string => ROUTES.editAction.replace(':id', id);

export const organizationPath = (id: string): string => ROUTES.organization.replace(':id', id);

export const organizationManagePath = (id: string): string => ROUTES.organizationManage.replace(':id', id);

/** La carte, centrée sur une action ouverte (`MapPage` lit `?focus=`). */
export const mapFocusPath = (actionId: string): string => `${ROUTES.map}?${FOCUS_PARAM}=${actionId}`;
