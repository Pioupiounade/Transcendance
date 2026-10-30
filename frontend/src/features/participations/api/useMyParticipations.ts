import { useCallback, useEffect } from 'react';
import { useAuth } from '@/features/auth';
import { useResource } from '@/shared/hooks/useResource';
import type { MyParticipation } from '../types';
import { fetchMyParticipations } from './participationsApi';

const NO_PARTICIPATIONS: MyParticipation[] = [];

/**
 * Participations de l'utilisateur connecté, avec ses états. Visiteur : liste vide, sans appel (route JWT).
 * Relues dès qu'une action change (`action:updated`) : une action annulée, par son créateur ou parce qu'il a été
 * bloqué ou supprimé, doit quitter l'agenda.
 */
export function useMyParticipations() {
  const { status } = useAuth();
  const signedIn = status === 'authenticated';
  const load = useCallback(
    (signal: AbortSignal) => (signedIn ? fetchMyParticipations(signal) : Promise.resolve(NO_PARTICIPATIONS)),
    [signedIn],
  );
  const { data, loading, error, reload } = useResource(load);

  useEffect(() => {
    window.addEventListener('action:updated', reload);
    return () => window.removeEventListener('action:updated', reload);
  }, [reload]);

  return { participations: data ?? NO_PARTICIPATIONS, loading: status === 'loading' || loading, error };
}
