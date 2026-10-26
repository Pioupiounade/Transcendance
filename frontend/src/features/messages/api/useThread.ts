import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/shared/api';
import type { DirectMessage } from '../types';
import { fetchThread, sendDirectMessage } from './messagesApi';

const POLL_INTERVAL_MS = 5_000;

type Snapshot = { friendId: string; messages: DirectMessage[] };

const toApiError = (error: unknown): ApiError => (error instanceof ApiError ? error : new ApiError(0, []));

/**
 * Fil avec un ami : lu à l'ouverture puis toutes les 5 s (onglet visible), relu après chaque envoi.
 * `messages` vaut `null` tant que le fil demandé n'est pas arrivé ; une relecture annule la précédente.
 */
export function useThread(friendId: string) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const latestRequest = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    latestRequest.current?.abort();
    const controller = new AbortController();
    latestRequest.current = controller;
    return fetchThread(friendId, controller.signal)
      .then((messages) => {
        if (controller.signal.aborted) return;
        setSnapshot({ friendId, messages });
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(toApiError(cause));
      });
  }, [friendId]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, POLL_INTERVAL_MS);
    return () => {
      latestRequest.current?.abort();
      window.clearInterval(timer);
    };
  }, [refresh]);

  // L'envoi est suivi d'une relecture : le fil montre l'état du serveur (id, date, ordre).
  const send = useCallback(
    (content: string) => sendDirectMessage(friendId, content).then(() => refresh()),
    [friendId, refresh],
  );

  const messages = snapshot?.friendId === friendId ? snapshot.messages : null;
  return { messages, error: messages === null ? error : null, send, refresh };
}
