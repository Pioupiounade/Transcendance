import { useEffect, useState } from 'react';
import { ApiError } from '@/shared/api';
import type { Action } from '../types';
import { fetchAction } from './actionsApi';

type Result = { id: string; action: Action | null; error: ApiError | null };

const toApiError = (error: unknown): ApiError => (error instanceof ApiError ? error : new ApiError(0, []));

/**
 * Une action par id, avec ses états : `loading`, `notFound` (404), `error` (autre), `action`.
 * Remplaçable par TanStack Query sans toucher aux pages.
 */
export function useAction(id: string) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchAction(id, controller.signal)
      .then((action) => setResult({ id, action, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ id, action: null, error: toApiError(error) });
      });
    return () => controller.abort();
  }, [id]);

  const loading = result === null || result.id !== id;
  const error = loading ? null : result.error;
  return {
    action: loading ? null : result.action,
    loading,
    notFound: error?.status === 404,
    error: error && error.status !== 404 ? error : null,
  };
}
