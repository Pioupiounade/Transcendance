import { useResource } from '@/shared/hooks/useResource';
import type { Organization } from '../types';
import { fetchOrganizations } from './organizationsApi';

const NO_ORGANIZATIONS: Organization[] = [];

/** Toutes les organisations, avec leurs états. La recherche et le tri se font ensuite côté client (directory.ts). */
export function useOrganizations() {
  const { data, loading, error, reload } = useResource(fetchOrganizations);
  return { organizations: data ?? NO_ORGANIZATIONS, loading, error, reload };
}
