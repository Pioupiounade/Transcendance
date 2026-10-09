import type { MembershipWithOrganization, Organization, RoleOrg } from '@/features/organizations';
import { http } from '@/shared/api';

// Lectures d'organisation dont la feature actions a besoin (fiche, formulaire). Elles ne passent pas par
// `features/organizations`, qui importe déjà `features/actions` : l'import inverse ferait un cycle (CLAUDE.md,
// « Dépendances »). Les types, eux, viennent de l'index de la feature propriétaire (effacés à la compilation).

/** L'organisation liée à une action (`GET /organizations/:id`, api_contract §12) ; 404 → `ApiError`. */
export const fetchActionOrganization = (id: string, signal?: AbortSignal) =>
  http.get<Organization>(`/organizations/${id}`, { signal });

// Rôles qui autorisent à créer une action pour l'organisation (`POST /actions`, §15).
const MANAGING_ROLES: readonly RoleOrg[] = ['OWNER', 'MANAGER'];

/**
 * Organisations pour lesquelles l'utilisateur peut créer une action : ses adhésions actives en `OWNER` ou `MANAGER`,
 * en une requête (`GET /organization-members/user/:id/organizations`, §13 : adhésions `ACTIVE` seulement).
 */
export const fetchManageableOrganizations = async (userId: string, signal?: AbortSignal): Promise<Organization[]> => {
  const memberships = await http.list<MembershipWithOrganization>(
    `/organization-members/user/${userId}/organizations`,
    { signal },
  );
  return memberships.filter((membership) => MANAGING_ROLES.includes(membership.role)).map((m) => m.organization);
};
