import type { AuthUser } from '@/features/auth';
import { http } from '@/shared/api';
import type {
  ProfileVisibility,
  UserProfile,
} from '@/features/profile';

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

type AdminProfileResponse = {
  user_id: string;
  username: string;
  description: string | null;
  profile_picture: string | null;
  location: number[] | null;
  visibility: ProfileVisibility;
  commune: string | null;
};

export async function fetchAdminProfile(
  userId: string,
  signal?: AbortSignal,
): Promise<UserProfile | null> {
  const profile = await http.get<AdminProfileResponse | null>(
    `/profiles/admin/${encodeURIComponent(userId)}`,
    { signal },
  );

  if (!profile) return null;

  return {
    username: profile.username,
    description: profile.description ?? '',
    profilePicture: profile.profile_picture ?? undefined,
    visibility: profile.visibility,
    commune: profile.commune,
    location: profile.location
      ? {
          latitude: profile.location[0],
          longitude: profile.location[1],
        }
      : null,
  };
}

export async function updateAdminProfile(
  userId: string,
  profile: Pick<UserProfile, 'username' | 'description' | 'visibility'>,
): Promise<void> {
  await http.patch(`/profiles/${encodeURIComponent(userId)}`, {
    username: profile.username,
    description: profile.description,
    visibility: profile.visibility,
  });
}

export const deleteUserAccount = (id: string) =>
  http.delete<{ deleted: boolean; user_id: string }>(
    `/users/${encodeURIComponent(id)}`,
  );

export const changeUserRole = (
  id: string,
  role: 'USER' | 'ADMIN',
) =>
  http.patch<AuthUser>(
    `/users/${encodeURIComponent(id)}/role`,
    { role },
  );

type CreateAdminAccountResult =
  | { success: true; user: AuthUser }
  | { success: false; reason: 'EMAIL_TAKEN' };

export const createAdminAccount = (
  email: string,
  password: string,
) =>
  http.post<CreateAdminAccountResult>('/users', {
    email,
    password,
  });
