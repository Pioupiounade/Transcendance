import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/shared/api';
import type { Action } from '../types';
import { fetchActions } from './actionsApi';

type Result = { attempt: number; actions: Action[]; error: ApiError | null };

const toApiError = (error: unknown): ApiError => (error instanceof ApiError ? error : new ApiError(0, []));

/**
 * Liste des actions avec ses trois états (chargement, erreur, succès) et un `reload`.
 * `loading` est dérivé du numéro de tentative : aucun setState synchrone dans l'effet.
 * Remplaçable par TanStack Query sans toucher aux composants.
 */
export function useActions() {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchActions(controller.signal)
      .then((actions) => setResult({ attempt, actions, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ attempt, actions: [], error: toApiError(error) });
      });
    return () => controller.abort();
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  const loading = result === null || result.attempt !== attempt;
  return {
    actions: result?.actions ?? [],
    error: loading ? null : result.error,
    loading,
    reload,
  };
}
