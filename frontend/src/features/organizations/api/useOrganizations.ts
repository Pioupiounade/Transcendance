import { useResource } from '@/shared/hooks/useResource';
import type { Organization } from '../types';
import { fetchOrganizations } from './organizationsApi';

const NO_ORGANIZATIONS: Organization[] = [];

/** Liste de toutes les organisations. */
export function useOrganizations() {
  const { data, loading, error, reload } = useResource(fetchOrganizations);

  return {
    organizations: data ?? NO_ORGANIZATIONS,
    loading,
    error,
    reload,
  };
}