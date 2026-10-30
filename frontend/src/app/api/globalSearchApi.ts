import { http } from '@/shared/api';
import type { Organization } from '@/features/organizations/types';

export type UserSearchResult = {
  user_id: string;
  username: string;
  profile_picture: string | null;
  description?: string | null;
};

export type GlobalSearchResults = {
  users: UserSearchResult[];
  organizations: Organization[];
};

/** Longueur max d'une recherche : le backend ne borne pas `q`, mais au-delà de 16 Ko d'URL Node répond 431 ; un
 * pseudo ou un titre d'organisation tient largement en 64 caractères. Le champ et l'appel partagent cette borne. */
export const SEARCH_QUERY_MAX_LENGTH = 64;

export async function globalSearch(
  query: string,
  signal?: AbortSignal,
): Promise<GlobalSearchResults> {
  const q = query.trim().slice(0, SEARCH_QUERY_MAX_LENGTH);

  if (!q) {
    return {
      users: [],
      organizations: [],
    };
  }

  const encodedQuery = encodeURIComponent(q);

  const [users, organizations] = await Promise.all([
    http.get<UserSearchResult[]>(
      `/profiles/search?q=${encodedQuery}`,
      { signal },
    ),
    http.get<Organization[]>(
      `/organizations/search?q=${encodedQuery}`,
      { signal },
    ),
  ]);

  return {
    users,
    organizations,
  };
}