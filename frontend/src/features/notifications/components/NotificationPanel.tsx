import type { NotificationsSnapshot } from '../api/useNotifications';
import { NOTIFICATIONS_LABELS } from '../labels';
import { NotificationItem } from './NotificationItem';
import styles from './NotificationPanel.module.css';

const SHOWN_COUNT = 10;

type NotificationPanelProps = {
  id: string;
  snapshot: NotificationsSnapshot | null;
  failed: boolean;
  unreadCount: number;
  onRead: (notificationId: string) => void;
  onReadAll: () => void;
  onNavigate: () => void;
};

const statusMessage = (snapshot: NotificationsSnapshot | null, failed: boolean): string | null => {
  if (snapshot === null) return failed ? NOTIFICATIONS_LABELS.error : NOTIFICATIONS_LABELS.loading;
  if (snapshot.notifications.length === 0) return NOTIFICATIONS_LABELS.empty;
  return null;
};

export function NotificationPanel({
  id,
  snapshot,
  failed,
  unreadCount,
  onRead,
  onReadAll,
  onNavigate,
}: NotificationPanelProps) {
  const status = statusMessage(snapshot, failed);

  return (
    <div id={id} className={styles.panel}>
      <div className={styles.head}>
        <h2 className={styles.title}>{NOTIFICATIONS_LABELS.title}</h2>
        {unreadCount > 0 && (
          <button type="button" className={styles.readAll} onClick={onReadAll}>
            {NOTIFICATIONS_LABELS.markAllRead}
          </button>
        )}
      </div>
      {status && (
        <p className={styles.status} role="status">
          {status}
        </p>
      )}
      {snapshot && snapshot.notifications.length > 0 && (
        <ul className={styles.list}>
          {snapshot.notifications.slice(0, SHOWN_COUNT).map((notification) => (
            <li key={notification.notification_id}>
              <NotificationItem
                notification={notification}
                now={snapshot.receivedAt}
                onRead={onRead}
                onNavigate={onNavigate}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
