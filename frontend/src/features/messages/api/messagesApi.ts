import { http } from '@/shared/api';
import type { DirectMessage } from '../types';


export const fetchUnreadMessageCount = (signal?: AbortSignal) =>
  http.get<{ count: number }>('/direct-messages/unread-count', { signal });

/** Le fil avec un ami, du plus ancien au plus récent ; le backend marque lus les messages reçus (§18). */
export type ThreadResult =
  | DirectMessage[]
  | {
      available: false;
      reason: 'CONVERSATION_UNAVAILABLE';
    };

export const fetchThread = (
  friendId: string,
  signal?: AbortSignal,
) =>
  http.get<ThreadResult>(
    `/direct-messages/${friendId}`,
    { signal },
  );

export const sendDirectMessage = (friendId: string, content: string) =>
  http.post<DirectMessage>(`/direct-messages/${friendId}`, { content });

/* Le backend n'expose ni compteur de non-lus ni liste de conversations : la pastille de l'en-tête lit les
   notifications `NEW_MESSAGE` non lues (§17), que l'ouverture d'un fil marque lues. */
type MessageNotification = { notification_id: string; type: string; read: boolean };

export const fetchUnreadMessageNotifications = (signal?: AbortSignal) =>
  http
    .get<MessageNotification[]>('/notifications/me', { signal })
    .then((notifications) => notifications.filter((item) => item.type === 'NEW_MESSAGE' && !item.read));

export const markMessageNotificationsRead = async () => {
  const unread = await fetchUnreadMessageNotifications();
  await Promise.all(unread.map((item) => http.patch(`/notifications/${item.notification_id}/read`)));
  return unread.length;
};

/** Événement de fenêtre : des notifications de message viennent d'être lues, la pastille relit son compteur. */
export const MESSAGES_READ_EVENT = 'messages:read';
