import { http } from '@/shared/api';

export type NotificationType =
  | 'ACTION_MIN_REACHED'
  | 'ACTION_MAX_REACHED'
  | 'ACTION_COMMENT'
  | 'FRIEND_REQUEST'
  | 'ORGANIZATION_JOIN_REQUEST'
  | 'ORGANIZATION_COMMENT'
  | 'ACTION_APPROVED'
  | 'ACTION_STATUS_CHANGED'
  | 'NEW_MESSAGE'
  | 'ORGANIZATION_OWNERSHIP_TRANSFERRED';

export interface NotificationPreference {
  user_id: string;
  type: NotificationType;
  enabled: boolean;
}

export const NOTIFICATION_LABELS: Record<NotificationType, string> = {
  NEW_MESSAGE: 'New messages',
  FRIEND_REQUEST: 'Friend requests',
  ACTION_COMMENT: 'Action comments',
  ORGANIZATION_COMMENT: 'Organization comments',
  ORGANIZATION_JOIN_REQUEST: 'Organization requests',
  ACTION_STATUS_CHANGED: 'Action status updates',
  ACTION_APPROVED: 'Action approval',
  ACTION_MIN_REACHED: 'Minimum participants reached',
  ACTION_MAX_REACHED: 'Action full',
  ORGANIZATION_OWNERSHIP_TRANSFERRED: 'Organization ownership transferred to you',
};

export async function getNotificationPreferences(signal?: AbortSignal): Promise<NotificationPreference[]> {
  return http.get<NotificationPreference[]>('/notifications/preferences', { signal });
}

export async function updateNotificationPreference(
  type: NotificationType,
  enabled: boolean,
): Promise<NotificationPreference> {
  return http.patch<NotificationPreference>('/notifications/preferences', {
    type,
    enabled,
  });
}