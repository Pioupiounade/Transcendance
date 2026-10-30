import { useCallback, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { useResource } from '@/shared/hooks/useResource';
import type { MembershipWithOrganization } from '../types';
import { fetchUserMemberships } from './organizationsApi';

const NO_MEMBERSHIPS: MembershipWithOrganization[] = [];

/**
 * Mes adhésions actives (mon rôle par organisation). Visiteur : liste vide, sans appel.
 * Relues dès qu'une organisation change (`organization:updated`) : une organisation fermée, par son owner ou parce
 * qu'il a été bloqué ou supprimé, doit sortir de « Create as » et du filtre « Mine ».
 */
export function useMyMemberships() {
  const { status, user } = useAuth();
  const userId = user?.user_id ?? null;
  const load = useCallback(
    (signal: AbortSignal) => (userId === null ? Promise.resolve(NO_MEMBERSHIPS) : fetchUserMemberships(userId, signal)),
    [userId],
  );
  const { data, loading, error, reload } = useResource(load);

  useEffect(() => {
    window.addEventListener('organization:updated', reload);
    return () => window.removeEventListener('organization:updated', reload);
  }, [reload]);

  return { memberships: data ?? NO_MEMBERSHIPS, loading: status === 'loading' || loading, error, reload };
}
