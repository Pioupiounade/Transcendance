import { distanceMeters, type LatLng } from '@/features/actions';
import { ORGANIZATION_STATUS, type Organization, type RoleOrg } from './types';

// Annuaire des organisations (#63) : ce que le visiteur demande (recherche, tri, filtres), gardé dans l'URL, et la
// liste qui en découle. Fonctions pures : `GET /organizations` renvoie tout, le reste se fait ici.

export const DIRECTORY_SORT = { NEAREST: 'nearest', NAME: 'name', NEWEST: 'newest' } as const;
export type DirectorySort = (typeof DIRECTORY_SORT)[keyof typeof DIRECTORY_SORT];

export const DIRECTORY_SCOPE = { ALL: 'all', MINE: 'mine' } as const;
export type DirectoryScope = (typeof DIRECTORY_SCOPE)[keyof typeof DIRECTORY_SCOPE];

export type DirectoryView = {
  query: string;
  sort: DirectorySort;
  scope: DirectoryScope;
  /** Montrer aussi les organisations fermées ou suspendues. */
  closed: boolean;
};

export type DirectoryEntry = {
  organization: Organization;
  /** Mètres depuis le point de référence. */
  distance: number;
  /** Mon rôle si j'en suis membre actif. */
  role: RoleOrg | null;
};

const PARAM = { query: 'q', sort: 'sort', scope: 'scope', closed: 'closed' } as const;
const SORTS: readonly string[] = Object.values(DIRECTORY_SORT);

/** Lit la vue dans l'URL ; une valeur inconnue retombe sur le défaut (tout, au plus près, actives seulement). */
export const readDirectoryView = (params: URLSearchParams): DirectoryView => {
  const sort = params.get(PARAM.sort);
  return {
    query: params.get(PARAM.query) ?? '',
    sort: sort !== null && SORTS.includes(sort) ? (sort as DirectorySort) : DIRECTORY_SORT.NEAREST,
    scope: params.get(PARAM.scope) === DIRECTORY_SCOPE.MINE ? DIRECTORY_SCOPE.MINE : DIRECTORY_SCOPE.ALL,
    closed: params.get(PARAM.closed) === '1',
  };
};

/** Paramètres d'URL de la vue ; les valeurs par défaut n'y figurent pas (`/organizations` reste nu). */
export const directoryParams = (view: DirectoryView): Record<string, string> => {
  const params: Record<string, string> = {};
  if (view.query !== '') params[PARAM.query] = view.query;
  if (view.sort !== DIRECTORY_SORT.NEAREST) params[PARAM.sort] = view.sort;
  if (view.scope !== DIRECTORY_SCOPE.ALL) params[PARAM.scope] = view.scope;
  if (view.closed) params[PARAM.closed] = '1';
  return params;
};

/** Minuscules sans accents : « recyclerie » trouve « Recyclerie », « cafe » trouve « Café ». */
const fold = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const COMPARE: Record<DirectorySort, (a: DirectoryEntry, b: DirectoryEntry) => number> = {
  nearest: (a, b) => a.distance - b.distance,
  name: (a, b) => a.organization.title.localeCompare(b.organization.title, 'en', { sensitivity: 'base' }),
  // Dates ISO : l'ordre des chaînes est l'ordre chronologique.
  newest: (a, b) => b.organization.created_at.localeCompare(a.organization.created_at),
};

/**
 * La liste de l'annuaire pour une vue : chaque mot de la recherche doit se trouver dans le titre, l'adresse ou la
 * description. `inactive` compte les organisations fermées ou suspendues qui répondent à la recherche, montrées ou non.
 */
export const listDirectory = (
  organizations: Organization[],
  roles: ReadonlyMap<string, RoleOrg>,
  center: LatLng,
  view: DirectoryView,
): { entries: DirectoryEntry[]; inactive: number } => {
  const terms = fold(view.query).split(/\s+/).filter(Boolean);
  const matching = organizations
    .filter((organization) => {
      if (view.scope === DIRECTORY_SCOPE.MINE && !roles.has(organization.organization_id)) return false;
      const text = fold(`${organization.title} ${organization.address} ${organization.description}`);
      return terms.every((term) => text.includes(term));
    })
    .map((organization) => ({
      organization,
      distance: distanceMeters(center, organization.location),
      role: roles.get(organization.organization_id) ?? null,
    }));
  const isActive = (entry: DirectoryEntry) => entry.organization.organization_status === ORGANIZATION_STATUS.ACTIVE;
  const entries = (view.closed ? matching : matching.filter(isActive)).sort(COMPARE[view.sort]);
  return { entries, inactive: matching.filter((entry) => !isActive(entry)).length };
};
