import { useEffect, useRef, useState } from 'react';
import { MESSAGES_READ_EVENT, fetchUnreadMessageCount } from './messagesApi';

const POLL_INTERVAL_MS = 30_000;

/** Nombre de notifications `NEW_MESSAGE` non lues, relu toutes les 30 s (onglet visible) et après une lecture. */
export function useUnreadMessages(): number {
  const [count, setCount] = useState(0);
  const latestRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    let disposed = false;
    const refresh = () => {
      latestRequest.current?.abort();
      const controller = new AbortController();
      latestRequest.current = controller;
      fetchUnreadMessageCount(controller.signal)
        .then(({ count }) => {
          if (!disposed && !controller.signal.aborted) setCount(count);
        })
        .catch(() => undefined);
    };
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_INTERVAL_MS);
    window.addEventListener(MESSAGES_READ_EVENT, refresh);
    window.addEventListener('direct-message:new', refresh);
    return () => {
      disposed = true;
      latestRequest.current?.abort();
      window.clearInterval(timer);
      window.removeEventListener(MESSAGES_READ_EVENT, refresh);
      window.removeEventListener('direct-message:new', refresh);
    };
  }, []);

  return count;
}
