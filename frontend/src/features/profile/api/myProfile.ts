import { useCallback, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { http, isApiError } from '@/shared/api';
import { useResource } from '@/shared/hooks/useResource';

/** `GET /profiles/me` (docs/api_contract.md §7) : la seule route qui renvoie `location`. */
export type MyProfile = {
  user_id: string;
  username: string;
  description: string | null;
  profile_picture: string | null;
  /** Commune déduite de `location` par le backend ; `null` hors France ou si la recherche a échoué. */
  commune: string | null;
  location?: [number, number];
};

/** Profil de l'utilisateur connecté ; `null` sans profil (404 : cas normal après l'inscription). */
export const fetchMyProfile = async (signal?: AbortSignal): Promise<MyProfile | null> => {
  try {
    return await http.get<MyProfile>('/profiles/me', { signal });
  } catch (error) {
    if (isApiError(error) && error.status === 404) return null;
    throw error;
  }
};

const NO_PROFILE = Promise.resolve(null);

/**
 * `profile` vaut `null` tant que le chargement n'est pas fini ou sans profil ; `loading` fait la différence.
 * Visiteur : aucun appel (`/profiles/me` répondrait 401, une erreur console) ; une session qui s'ouvre relance le chargement.
 */
export function useMyProfile() {
  const { status, user } = useAuth();
  const authenticated = status === 'authenticated';
  const userId = user?.user_id ?? null;
  const load = useCallback(
    (signal: AbortSignal) => (authenticated ? fetchMyProfile(signal) : NO_PROFILE),
    [authenticated],
  );
  const { data, loading, reload } = useResource(load);

  // Mon profil change ailleurs (photo envoyée, retouche par un admin) : relecture, filtrée sur mon id.
  useEffect(() => {
    if (userId === null) return;
    const handleProfileUpdated = (event: Event) => {
      if ((event as CustomEvent<{ userId: string }>).detail.userId === userId) reload();
    };
    window.addEventListener('profile:updated', handleProfileUpdated);
    return () => window.removeEventListener('profile:updated', handleProfileUpdated);
  }, [userId, reload]);

  return { profile: data, loading };
}
