import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/shared/api';
import type { Action } from '../types';
import { fetchAction } from './actionsApi';

type Result = {
  attempt: number;
  id: string;
  action: Action | null;
  error: ApiError | null;
};

const toApiError = (error: unknown): ApiError =>
  error instanceof ApiError ? error : new ApiError(0, []);

export function useAction(id: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchAction(id, controller.signal)
      .then((action) => {
        if (!controller.signal.aborted) {
          setResult({ id, attempt, action, error: null });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setResult({
          id,
          attempt,
          action: null,
          error: toApiError(error),
        });
      });

    return () => controller.abort();
  }, [id, attempt]);

  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    window.addEventListener('user:deleted', reload);

    return () => {
      window.removeEventListener('user:deleted', reload);
    };
  }, [reload]);

  const loading =
    result === null ||
    result.id !== id ||
    result.attempt !== attempt;

  const current = loading ? null : result;
  const error = current?.error ?? null;

  return {
    action: current?.action ?? null,
    loading,
    notFound:
      current !== null &&
      (
        current.error?.status === 404 ||
        (current.error === null && current.action === null)
      ),
    error: error && error.status !== 404 ? error : null,
  };
}