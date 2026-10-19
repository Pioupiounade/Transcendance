import { Link } from 'react-router';
import { NOTIFICATIONS_LABELS } from '../labels';
import { formatTimeAgo } from '../timeAgo';
import type { Notification } from '../types';
import styles from './NotificationItem.module.css';

type NotificationItemProps = {
  notification: Notification;
  now: number;
  onRead: (notificationId: string) => void;
  onNavigate: () => void;
};

export function NotificationItem({ notification, now, onRead, onNavigate }: NotificationItemProps) {
  const { notification_id, title, message, link, read, created_at } = notification;
  const className = read ? styles.item : `${styles.item} ${styles.unread}`;
  const markRead = () => {
    if (!read) onRead(notification_id);
  };
  const content = (
    <>
      {!read && <span className={styles.srOnly}>{NOTIFICATIONS_LABELS.unread}</span>}
      <span className={styles.title}>{title}</span>
      <span className={styles.message}>{message}</span>
      <time className={styles.time} dateTime={created_at}>
        {formatTimeAgo(created_at, now)}
      </time>
    </>
  );

  if (link) {
    const follow = () => {
      markRead();
      onNavigate();
    };
    return (
      <Link to={link} className={className} onClick={follow}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={className} aria-disabled={read || undefined} onClick={markRead}>
      {content}
    </button>
  );
}
