import { useCallback } from 'react';
import { useResource } from '@/shared/hooks/useResource';
import { fetchOrganizations, searchOrganizations } from './organizationsApi';

/** Liste ou recherche (quand `query` n'est pas vide), avec ses états. */
export function useOrganizations(query: string) {
  const q = query.trim();
  const load = useCallback(
    (signal: AbortSignal) => (q === '' ? fetchOrganizations(signal) : searchOrganizations(q, signal)),
    [q],
  );
  const { data, loading, error, reload } = useResource(load);
  return { organizations: data ?? [], loading, error, reload };
}
