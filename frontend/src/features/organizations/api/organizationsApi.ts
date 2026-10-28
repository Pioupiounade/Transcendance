import { http } from '@/shared/api';
import type {
  Membership,
  MembershipWithOrganization,
  Organization,
  OrganizationComment,
  OrganizationMember,
  MemberStatus,
  RoleOrg,
} from '../types';

/** Toutes les organisations, tous statuts (docs/api_contract.md §12). */
export const fetchOrganizations = (signal?: AbortSignal) => http.list<Organization>('/organizations', { signal });

/** Adhésions actives d'un utilisateur, avec son rôle dans chaque organisation (route publique, §13) ; aucune → `[]`. */
export const fetchUserMemberships = (userId: string, signal?: AbortSignal) =>
  http.get<MembershipWithOrganization[]>(`/organization-members/user/${userId}/organizations`, { signal });

/** Récupère une organisation ; une réponse vide signifie qu'elle n'existe pas. */
export const fetchOrganization = async (
  id: string,
  signal?: AbortSignal,
): Promise<Organization | null> => {
  const organization = await http.get<Organization | null>(
    `/organizations/${id}`,
    { signal },
  );

  return organization ?? null;
};

/** Membres actifs (comptes actifs) d'une organisation, route publique (§13). */
export const fetchOrganizationMembers = (id: string, signal?: AbortSignal) =>
  http.list<OrganizationMember>(`/organization-members/organization/${id}/members`, { signal });

export type MyOrganizationMembership = {
  status: MemberStatus;
  role: RoleOrg;
};

export const fetchMyOrganizationMembership = (id: string, signal?: AbortSignal) =>
  http.get<MyOrganizationMembership | null>(
    `/organization-members/organization/${id}/me`,
    { signal },
  );

/**
 * Demande d'adhésion (JWT) : crée une adhésion `PENDING`, à valider par un gestionnaire. 409 = demande déjà en
 * attente, déjà membre ou demande déjà refusée ; 403 = banni ; 400 = organisation inactive (§13).
 */
export const joinOrganization = (id: string) =>
  http.post<Membership>(`/organization-members/organization/${id}/join`);

export const leaveOrganization = (id: string) =>
  http.delete<{ success: boolean; organizationClosed: boolean }>(
    `/organization-members/organization/${id}/leave`,
  );

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

/** Réactive une adhésion `REJECTED` ou `BANNED` (`ACTIVE`, rôle `MEMBER`). */
export const reactivateMembership = (organizationId: string, userId: string) =>
  http.patch<Membership>(`${memberPath(organizationId, userId)}/reactivate`);

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

/** Champs de création (`CreateOrganizationDto`, tous obligatoires) ; `location` = `[latitude, longitude]`. */
export type CreateOrganizationInput = {
  title: string;
  description: string;
  address: string;
  location: [number, number];
};

/**
 * Crée une organisation (JWT) : `ACTIVE`, `creator_id` = moi. Depuis le 09/10/2026 (#135) le backend crée aussi
 * mon adhésion `OWNER` dans la même transaction : la fiche se gère dès l'arrivée. 400 = compte non actif.
 */
export const createOrganization = (input: CreateOrganizationInput) =>
  http.post<Organization>('/organizations', input);

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

/** Rouvre une organisation sans propriétaire en lui attribuant un nouveau owner. */
export const reopenOrganizationWithOwner = (
  organizationId: string,
  newOwnerId: string,
) =>
  http.patch<{ success: boolean }>(
    `/organizations/${organizationId}/reopen-with-owner`,
    { newOwnerId },
  );

/** Commentaires d'une organisation, du plus récent au plus ancien (route publique). 404 → organisation inconnue. */
export const fetchOrganizationComments = (organizationId: string, signal?: AbortSignal) =>
  http.get<OrganizationComment[]>(`/organizations/${organizationId}/comments`, { signal });

export type OrganizationCommentPostResult =
  | OrganizationComment
  | {
      success: false;
      code: 'NOT_ACTIVE_MEMBER' | 'ACCOUNT_NOT_ACTIVE' | 'ORGANIZATION_INACTIVE';
      message: string;
    };

/** Poste un commentaire ou renvoie un refus métier explicite. */
export const postOrganizationComment = (
  organizationId: string,
  content: string,
) =>
  http.post<OrganizationCommentPostResult>(
    `/organizations/${organizationId}/comments`,
    { comment: content },
  );

/** Supprime un commentaire (JWT) : son auteur ou le créateur de l'organisation, 403 sinon. */
export const deleteOrganizationComment = (commentId: string) =>
  http.delete<{ message: string }>(`/organizations/comments/${commentId}`);
