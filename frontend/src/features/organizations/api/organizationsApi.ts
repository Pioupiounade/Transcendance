import { http } from '@/shared/api';
import type { Organization, OrganizationMember } from '../types';

/** Toutes les organisations, tous statuts (docs/api_contract.md §12). */
export const fetchOrganizations = (signal?: AbortSignal) => http.list<Organization>('/organizations', { signal });

/** Recherche par sous-chaîne du titre (15 max). */
export const searchOrganizations = (query: string, signal?: AbortSignal) =>
  http.list<Organization>('/organizations/search', { query: { q: query }, signal });

/** Une organisation ; 404 → `ApiError` status 404. */
export const fetchOrganization = (id: string, signal?: AbortSignal) =>
  http.get<Organization>(`/organizations/${id}`, { signal });

/** Membres actifs (comptes actifs) d'une organisation, route publique (§13). */
export const fetchOrganizationMembers = (id: string, signal?: AbortSignal) =>
  http.list<OrganizationMember>(`/organization-members/organization/${id}/members`, { signal });

export async function fetchManageableOrganizations(
  userId: string,
  signal?: AbortSignal,
): Promise<Organization[]> {
  const organizations = await fetchOrganizations(signal);

  const manageable: Organization[] = [];

  for (const organization of organizations) {
    const members = await fetchOrganizationMembers(
      organization.organization_id,
      signal,
    );

    const membership = members.find(
      (member) => member.user_id === userId,
    );

    if (
      membership?.status === 'ACTIVE' &&
      (membership.role === 'OWNER' || membership.role === 'MANAGER')
    ) {
      manageable.push(organization);
    }
  }

  return manageable;
}