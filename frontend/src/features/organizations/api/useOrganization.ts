import { useCallback } from 'react';
import { useResource } from '@/shared/hooks/useResource';
import { fetchOrganization, fetchOrganizationMembers, fetchMyOrganizationMembership } from './organizationsApi';

/** Une organisation par id : `notFound` (404) séparé des autres erreurs. */
export function useOrganization(id: string) {
  const load = useCallback((signal: AbortSignal) => fetchOrganization(id, signal), [id]);
  const { data, loading, error } = useResource(load);
  return {
    organization: data,
    loading,
    notFound: error?.status === 404,
    error: error && error.status !== 404 ? error : null,
  };
}

/** Membres actifs d'une organisation. */
export function useOrganizationMembers(id: string) {
  const load = useCallback((signal: AbortSignal) => fetchOrganizationMembers(id, signal), [id]);
  const { data, loading, error } = useResource(load);
  return { members: data ?? [], loading, error };
}

export function useMyOrganizationMembership(id: string, enabled: boolean) {
  const load = useCallback(
    (signal: AbortSignal) =>
      enabled
        ? fetchMyOrganizationMembership(id, signal)
        : Promise.resolve(null),
    [id, enabled],
  );

  const { data, loading, error } = useResource(load);

  return {
    membership: data ?? null,
    loading: enabled ? loading : false,
    error: enabled ? error : null,
  };
}