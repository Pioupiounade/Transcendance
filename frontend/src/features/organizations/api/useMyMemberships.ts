import { useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { useResource } from '@/shared/hooks/useResource';
import type { MembershipWithOrganization } from '../types';
import { fetchUserMemberships } from './organizationsApi';

const NO_MEMBERSHIPS: MembershipWithOrganization[] = [];

/** Mes adhésions actives (mon rôle par organisation). Visiteur : liste vide, sans appel. */
export function useMyMemberships() {
  const { status, user } = useAuth();
  const userId = user?.user_id ?? null;
  const load = useCallback(
    (signal: AbortSignal) => (userId === null ? Promise.resolve(NO_MEMBERSHIPS) : fetchUserMemberships(userId, signal)),
    [userId],
  );
  const { data, loading, error, reload } = useResource(load);
  return { memberships: data ?? NO_MEMBERSHIPS, loading: status === 'loading' || loading, error, reload };
}
