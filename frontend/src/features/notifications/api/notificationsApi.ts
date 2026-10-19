import { http } from '@/shared/api';
import type { Notification } from '../types';

/** Tout l'historique, lues comprises, du plus récent au plus ancien ; `[]` si aucune. */
export const fetchMyNotifications = (signal?: AbortSignal) =>
  http.get<Notification[]>('/notifications/me', { signal });

export const markNotificationRead = (notificationId: string) =>
  http.patch<Notification>(`/notifications/${notificationId}/read`);

export const markAllNotificationsRead = () => http.patch<{ count: number }>('/notifications/me/read-all');
