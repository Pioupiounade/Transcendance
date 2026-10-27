import { useCallback } from 'react';
import { useResource } from '@/shared/hooks/useResource';
import { fetchOrganization, fetchOrganizationMembers, fetchMyOrganizationMembership } from './organizationsApi';

/** Une organisation par id : `notFound` (404) séparé des autres erreurs. */

/** Une organisation par id : absence et erreurs sont distinguées. */
export function useOrganization(id: string) {
  const load = useCallback(
    (signal: AbortSignal) => fetchOrganization(id, signal),
    [id],
  );

  const { data, loading, error, reload } = useResource(load);

  return {
    organization: data,
    loading,
    notFound:
      !loading &&
      (data == null || error?.status === 404),
    error: error && error.status !== 404 ? error : null,
    reload,
  };
}

/** Membres actifs d'une organisation existante. */
export function useOrganizationMembers(
  id: string,
  enabled: boolean,
) {
  const load = useCallback(
    (signal: AbortSignal) =>
      enabled
        ? fetchOrganizationMembers(id, signal)
        : Promise.resolve([]),
    [id, enabled],
  );

  const { data, loading, error, reload } = useResource(load);

  return {
    members: data ?? [],
    loading: enabled && loading,
    error: enabled ? error : null,
    reload,
  };
}

export function useMyOrganizationMembership(id: string, enabled: boolean) {
  const load = useCallback(
    (signal: AbortSignal) =>
      enabled
        ? fetchMyOrganizationMembership(id, signal)
        : Promise.resolve(null),
    [id, enabled],
  );

  const { data, loading, error, reload } = useResource(load);

  return {
    membership: data ?? null,
    loading: enabled ? loading : false,
    error: enabled ? error : null,
    reload,
  };
}
