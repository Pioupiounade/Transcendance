import type { AuthUser } from '@/features/auth';
import { http } from '@/shared/api';

// Routes `/users` réservées à l'administration (docs/api_contract.md §6). Le backend revérifie le rôle ADMIN.

/** Tous les comptes, tous statuts, sans nom d'utilisateur (il vit dans le profil). */
export const fetchUsers = (signal?: AbortSignal) => http.list<AuthUser>('/users', { signal });

/** Un compte par son id (route publique). */
const fetchUser = (id: string) => http.get<AuthUser>(`/users/${id}`);

/**
 * Bloque un compte actif : `SUSPENDED` et −50 points. 400 « User is already suspended ».
 * La réponse de `suspend` porte les points d'avant la pénalité : le compte est relu pour afficher le vrai solde.
 */
export const blockUser = async (id: string): Promise<AuthUser> => {
  await http.patch<AuthUser>(`/users/${id}/suspend`);
  return fetchUser(id);
};

/** Débloque un compte `SUSPENDED` (jamais un `DEACTIVATED`) ; les points perdus ne sont pas rendus. */
export const unblockUser = (id: string) => http.patch<AuthUser>(`/users/${id}/reactivate`);
