import { useCallback, useEffect, useRef, useState } from 'react';
import type { Notification } from '../types';
import { fetchMyNotifications, markAllNotificationsRead, markNotificationRead } from './notificationsApi';

const POLL_INTERVAL_MS = 5_000;

/** Dernière liste reçue ; `receivedAt` sert d'instant présent aux « il y a 5 minutes ». */
export type NotificationsSnapshot = { notifications: Notification[]; receivedAt: number };

/** Une relecture annule la précédente : la réponse la plus récente gagne. */
export function useNotifications() {
  const [snapshot, setSnapshot] = useState<NotificationsSnapshot | null>(null);
  const [failed, setFailed] = useState(false);
  const latestRequest = useRef<AbortController | null>(null);
  // Démontée (déconnexion), la cloche ne relit plus : les routes exigent le JWT.
  const disposed = useRef(false);

  const refresh = useCallback(() => {
    if (disposed.current) return Promise.resolve();
    latestRequest.current?.abort();
    const controller = new AbortController();
    latestRequest.current = controller;
    return fetchMyNotifications(controller.signal)
      .then((notifications) => {
        if (controller.signal.aborted) return;
        setSnapshot({ notifications, receivedAt: Date.now() });
        setFailed(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
  }, []);

  useEffect(() => {
    disposed.current = false;
    void refresh();

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed.current = true;
      latestRequest.current?.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refresh]);

  // Réussi ou non, le PATCH est suivi d'une relecture : la liste montre l'état du serveur.
  const markRead = useCallback(
    (notificationId: string) =>
      markNotificationRead(notificationId)
        .catch(() => null)
        .then(() => refresh()),
    [refresh],
  );
  const markAllRead = useCallback(
    () =>
      markAllNotificationsRead()
        .catch(() => null)
        .then(() => refresh()),
    [refresh],
  );

  const unreadCount = snapshot?.notifications.filter((notification) => !notification.read).length ?? 0;
  return { snapshot, failed, unreadCount, refresh, markRead, markAllRead };
}
