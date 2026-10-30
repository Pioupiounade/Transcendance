import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/shared/api';

type Loader<T> = (signal: AbortSignal) => Promise<T>;
type Result<T> = { load: Loader<T>; attempt: number; data: T | null; error: ApiError | null };

const toApiError = (error: unknown): ApiError => (error instanceof ApiError ? error : new ApiError(0, []));

/**
 * Chargement d'une ressource avec ses trois états (chargement, erreur, donnée) et un `reload`.
 * `load` doit être stable (`useCallback` chez l'appelant, avec ses paramètres en dépendances) : une nouvelle
 * fonction = une nouvelle requête, `loading` repasse à vrai et la précédente est annulée.
 * Ne connaît aucun événement métier : la feature qui doit relire sur un événement fenêtre l'écoute elle-même et
 * appelle `reload` (ex. `organization:updated` dans useOrganizations).
 * Remplaçable par TanStack Query sans toucher aux appelants.
 */
export function useResource<T>(load: Loader<T>) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setResult({ load, attempt, data, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ load, attempt, data: null, error: toApiError(error) });
      });
    return () => controller.abort();
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  
  useEffect(() => {
    window.addEventListener('user:deleted', reload);
    window.addEventListener('user:status-changed', reload);

    return () => {
      window.removeEventListener('user:deleted', reload);
      window.removeEventListener('user:status-changed', reload);
    };
  }, [reload]);
  
  const loading = result === null || result.load !== load || result.attempt !== attempt;
  return {
    data: loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    reload,
  };
}
