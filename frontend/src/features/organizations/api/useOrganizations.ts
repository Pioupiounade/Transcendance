import { useEffect } from 'react';
import { useResource } from '@/shared/hooks/useResource';
import type { Organization } from '../types';
import { fetchOrganizations } from './organizationsApi';

const NO_ORGANIZATIONS: Organization[] = [];

/**
 * Liste de toutes les organisations, relue dès qu'une organisation change (`organization:updated` : édition,
 * fermeture ou réouverture, dont la fermeture qui suit le blocage ou la suppression de son owner).
 */
export function useOrganizations() {
  const { data, loading, error, reload } = useResource(fetchOrganizations);

  useEffect(() => {
    window.addEventListener('organization:updated', reload);
    return () => window.removeEventListener('organization:updated', reload);
  }, [reload]);

  return {
    organizations: data ?? NO_ORGANIZATIONS,
    loading,
    error,
    reload,
  };
}
