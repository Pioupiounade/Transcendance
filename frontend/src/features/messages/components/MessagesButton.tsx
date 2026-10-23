import { Link, useLocation } from 'react-router';
import { Icon } from '@/shared/ui';
import { useUnreadMessages } from '../api/useUnreadMessages';
import { MESSAGES_LABELS } from '../labels';
import styles from './MessagesButton.module.css';

type MessagesButtonProps = {
  /** Chemin de la page des messages (`/messages`). */
  to: string;
};

/** Entrée discrète de la messagerie dans l'en-tête : une pastille, un point quand un message attend. */
export function MessagesButton({ to }: MessagesButtonProps) {
  const unread = useUnreadMessages();
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(`${to}/`);
  const label = unread > 0 ? MESSAGES_LABELS.entryUnread(unread) : MESSAGES_LABELS.entry;

  return (
    <Link to={to} className={styles.button} aria-label={label} title={label} aria-current={active ? 'page' : undefined}>
      <Icon name="chat" size={20} />
      {unread > 0 && <span className={styles.dot} aria-hidden="true" />}
    </Link>
  );
}
