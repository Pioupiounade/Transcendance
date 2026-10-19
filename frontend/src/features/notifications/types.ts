import type { NotificationType } from '@/features/profile';

/** Élément de `GET /notifications/me` (docs/api_contract.md §17) ; `link` est un chemin de l'app, ou `null`. */
export type Notification = {
  notification_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
};
