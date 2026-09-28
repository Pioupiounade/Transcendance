import { useEffect, useState } from 'react';
import { ApiError } from '@/shared/api';
import type { MyParticipation } from '../types';
import { fetchMyParticipations } from './participationsApi';

type Result = { participations: MyParticipation[]; error: ApiError | null };

const toApiError = (error: unknown): ApiError => (error instanceof ApiError ? error : new ApiError(0, []));

/** Participations de l'utilisateur connecté, avec ses états. Même forme que `useActions`. */
export function useMyParticipations() {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchMyParticipations(controller.signal)
      .then((participations) => setResult({ participations, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ participations: [], error: toApiError(error) });
      });
    return () => controller.abort();
  }, []);

  return {
    participations: result?.participations ?? [],
    loading: result === null,
    error: result?.error ?? null,
  };
}
