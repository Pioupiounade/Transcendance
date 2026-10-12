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

export async function globalSearch(
  query: string,
  signal?: AbortSignal,
): Promise<GlobalSearchResults> {
  const q = query.trim();

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