import { useEffect, useState } from 'react';
import { http, isApiError } from '@/shared/api';

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

/** `profile` vaut `null` tant que le chargement n'est pas fini ou sans profil ; `loading` fait la différence. */
export function useMyProfile() {
  const [state, setState] = useState<{ profile: MyProfile | null; loading: boolean }>({ profile: null, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    fetchMyProfile(controller.signal)
      .then((profile) => setState({ profile, loading: false }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ profile: null, loading: false });
      });
    return () => controller.abort();
  }, []);

  return state;
}
