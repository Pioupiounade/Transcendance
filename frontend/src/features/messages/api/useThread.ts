import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/shared/api';
import type { DirectMessage } from '../types';
import {
  MESSAGES_READ_EVENT,
  fetchThread,
  sendDirectMessage,
} from './messagesApi';
const POLL_INTERVAL_MS = 5_000;

type Snapshot = { friendId: string; messages: DirectMessage[] };

const toApiError = (error: unknown): ApiError =>
  error instanceof ApiError ? error : new ApiError(0, []);

export function useThread(friendId: string) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const latestRequest = useRef<AbortController | null>(null);
  const deletedPeers = useRef(new Set<string>());

  const refresh = useCallback(() => {
    if (deletedPeers.current.has(friendId)) {
      return Promise.resolve();
    }
    latestRequest.current?.abort();
    const controller = new AbortController();
    latestRequest.current = controller;

    return fetchThread(friendId, controller.signal)
      .then((messages) => {
        if (controller.signal.aborted) return;
        setSnapshot({ friendId, messages });
        setError(null);
        window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(toApiError(cause));
      });
  }, [friendId]);

  useEffect(() => {
    void refresh();

    const handleNewMessage = (event: Event) => {
      const message = (
        event as CustomEvent<{
          sender_id: string;
          receiver_id: string;
        }>
      ).detail;

      if (
        message &&
        (message.sender_id === friendId ||
          message.receiver_id === friendId)
      ) {
        void refresh();
      }
    };

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, POLL_INTERVAL_MS);

    const handleUserDeleted = (event: Event) => {
      const { userId } = (
        event as CustomEvent<{ userId: string }>
      ).detail;

      if (userId !== friendId) return;

      deletedPeers.current.add(userId);
      latestRequest.current?.abort();
      setSnapshot({ friendId, messages: [] });
      setError(null);
    };

    window.addEventListener('user:deleted', handleUserDeleted);
    window.addEventListener('direct-message:new', handleNewMessage);

    return () => {
      latestRequest.current?.abort();
      window.clearInterval(timer);
      window.removeEventListener('direct-message:new', handleNewMessage);
      window.removeEventListener('user:deleted', handleUserDeleted);
    };
  }, [friendId, refresh]);

  const send = useCallback(
    (content: string) => sendDirectMessage(friendId, content).then(() => refresh()),
    [friendId, refresh],
  );

  const messages = snapshot?.friendId === friendId ? snapshot.messages : null;
  return { messages, error: messages === null ? error : null, send, refresh };
}
