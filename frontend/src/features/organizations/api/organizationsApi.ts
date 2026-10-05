import { http } from '@/shared/api';
import type { Organization, OrganizationComment, OrganizationMember } from '../types';

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

/** Commentaires d'une organisation, du plus récent au plus ancien (route publique). 404 → organisation inconnue. */
export const fetchOrganizationComments = (organizationId: string, signal?: AbortSignal) =>
  http.get<OrganizationComment[]>(`/organizations/${organizationId}/comments`, { signal });

/** Poste un commentaire (JWT). Le DTO attend `comment` (≠ `content` des actions) ; l'API renvoie le commentaire avec son auteur. */
export const postOrganizationComment = (organizationId: string, content: string) =>
  http.post<OrganizationComment>(`/organizations/${organizationId}/comments`, { comment: content });

/** Supprime un commentaire (JWT) : son auteur ou le créateur de l'organisation, 403 sinon. */
export const deleteOrganizationComment = (commentId: string) =>
  http.delete<{ message: string }>(`/organizations/comments/${commentId}`);
