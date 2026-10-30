import { useCallback, useEffect } from 'react';
import { friendsApi } from '@/features/friends';
import { useResource } from '@/shared/hooks/useResource';

/**
 * Mes amis actifs = les conversations possibles (le backend ne liste pas les fils).
 * Relus quand un compte est supprimé ou change de statut (`user:deleted`, `user:status-changed`) : le backend ne
 * prévient pas ses amis par `friendship:changed`, et un ami bloqué sort de la liste des actifs.
 */
export function useFriendsList() {
  const load = useCallback((signal: AbortSignal) => friendsApi.getMyFriends(signal), []);
  const { data: friends, loading, error, reload } = useResource(load);

  useEffect(() => {
    window.addEventListener('user:deleted', reload);
    window.addEventListener('user:status-changed', reload);
    return () => {
      window.removeEventListener('user:deleted', reload);
      window.removeEventListener('user:status-changed', reload);
    };
  }, [reload]);

  return { friends, loading, error, reload };
}
