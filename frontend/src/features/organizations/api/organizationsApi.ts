import { http } from '@/shared/api';
import type {
  Membership,
  MembershipWithOrganization,
  Organization,
  OrganizationComment,
  OrganizationMember,
} from '../types';

/** Toutes les organisations, tous statuts (docs/api_contract.md §12). */
export const fetchOrganizations = (signal?: AbortSignal) => http.list<Organization>('/organizations', { signal });

/** Adhésions actives d'un utilisateur, avec son rôle dans chaque organisation (route publique, §13) ; aucune → `[]`. */
export const fetchUserMemberships = (userId: string, signal?: AbortSignal) =>
  http.get<MembershipWithOrganization[]>(`/organization-members/user/${userId}/organizations`, { signal });

/** Une organisation ; 404 → `ApiError` status 404. */
export const fetchOrganization = (id: string, signal?: AbortSignal) =>
  http.get<Organization>(`/organizations/${id}`, { signal });

/** Membres actifs (comptes actifs) d'une organisation, route publique (§13). */
export const fetchOrganizationMembers = (id: string, signal?: AbortSignal) =>
  http.list<OrganizationMember>(`/organization-members/organization/${id}/members`, { signal });

/**
 * Demande d'adhésion (JWT) : crée une adhésion `PENDING`, à valider par un gestionnaire. 409 = demande déjà en
 * attente, déjà membre ou demande déjà refusée ; 403 = banni ; 400 = organisation inactive (§13).
 */
export const joinOrganization = (id: string) =>
  http.post<Membership>(`/organization-members/organization/${id}/join`);

// --- Gestion (#62). Routes réservées aux gestionnaires (membre actif MANAGER ou OWNER) et aux ADMIN ; celles de
// rôles (promote, demote, transfer) au OWNER et aux ADMIN. Toutes refusent une organisation inactive (400).

const memberPath = (organizationId: string, userId: string) =>
  `/organization-members/organization/${organizationId}/member/${userId}`;

/** Toutes les adhésions, tous statuts (JWT, gestionnaire ou ADMIN ; 403 sinon). */
export const fetchMemberships = (organizationId: string, signal?: AbortSignal) =>
  http.get<OrganizationMember[]>(`/organization-members/organization/${organizationId}/memberships`, { signal });

/** Accepte une demande `PENDING` : le membre devient `ACTIVE` (+5 points au owner). */
export const approveMembership = (organizationId: string, userId: string) =>
  http.patch<Membership>(`${memberPath(organizationId, userId)}/approve`);

/** Refuse une demande `PENDING` (`REJECTED`) : définitif, le demandeur ne peut pas redemander. */
export const denyMembership = (organizationId: string, userId: string) =>
  http.patch<Membership>(`${memberPath(organizationId, userId)}/deny`);

/** Retire un membre actif (adhésion supprimée, −5 points au owner). Un manager ne retire que des `MEMBER`. */
export const removeMember = (organizationId: string, userId: string) =>
  http.delete<Membership>(`${memberPath(organizationId, userId)}/remove`);

/** Bannit un membre actif (`BANNED`, −15 points pour lui, −5 pour le owner). Aucune route pour débannir. */
export const banMember = (organizationId: string, userId: string) =>
  http.patch<Membership>(`${memberPath(organizationId, userId)}/ban`);

/** `MEMBER` → `MANAGER`. */
export const promoteMember = (organizationId: string, userId: string) =>
  http.patch<Membership>(`${memberPath(organizationId, userId)}/promote`);

/** `MANAGER` → `MEMBER`. */
export const demoteMember = (organizationId: string, userId: string) =>
  http.patch<Membership>(`${memberPath(organizationId, userId)}/demote`);

/** Cède la propriété : renvoie l'ancien owner (devenu `MANAGER`) et le nouveau. */
export const transferOwnership = (organizationId: string, newOwnerId: string) =>
  http.patch<[Membership, Membership]>(
    `/organization-members/organization/${organizationId}/transfer-ownership/${newOwnerId}`,
  );

/** Champs modifiables d'une organisation (`UpdateOrganizationDto`, tous facultatifs). */
export type UpdateOrganizationInput = { title?: string; description?: string; address?: string };

export const updateOrganization = (id: string, input: UpdateOrganizationInput) =>
  http.patch<Organization>(`/organizations/${id}`, input);

/** Ferme une organisation active (`CLOSED`). */
export const closeOrganization = (id: string) => http.patch<Organization>(`/organizations/${id}/deactivate`);

/** Suspend une organisation active (`SUSPENDED`) : ADMIN seulement, 403 sinon ; 400 si elle n'est pas active. */
export const suspendOrganization = (id: string) => http.patch<Organization>(`/organizations/${id}/suspend`);

/** Rouvre une organisation `CLOSED` ; une organisation `SUSPENDED` ne peut l'être que par un ADMIN. */
export const reopenOrganization = (id: string) => http.patch<Organization>(`/organizations/${id}/reactivate`);

/** Commentaires d'une organisation, du plus récent au plus ancien (route publique). 404 → organisation inconnue. */
export const fetchOrganizationComments = (organizationId: string, signal?: AbortSignal) =>
  http.get<OrganizationComment[]>(`/organizations/${organizationId}/comments`, { signal });

/** Poste un commentaire (JWT). Le DTO attend `comment` (≠ `content` des actions) ; l'API renvoie le commentaire avec son auteur. */
export const postOrganizationComment = (organizationId: string, content: string) =>
  http.post<OrganizationComment>(`/organizations/${organizationId}/comments`, { comment: content });

/** Supprime un commentaire (JWT) : son auteur ou le créateur de l'organisation, 403 sinon. */
export const deleteOrganizationComment = (commentId: string) =>
  http.delete<{ message: string }>(`/organizations/comments/${commentId}`);
