import { useEffect } from 'react';
import { Link } from 'react-router';
import type { FriendUserSummary } from '@/features/friends';
import { Avatar, Button, Icon } from '@/shared/ui';
import { MESSAGES_READ_EVENT, markMessageNotificationsRead } from '../api/messagesApi';
import { useThread } from '../api/useThread';
import { MESSAGES_LABELS } from '../labels';
import { MessageComposer } from './MessageComposer';
import { MessageThread } from './MessageThread';
import styles from './ThreadPane.module.css';

type ThreadPaneProps = {
  friend: FriendUserSummary;
  currentUserId: string;
  listPath: string;
  profilePath: (userId: string) => string;
};

/** Le fil avec un ami ; à l'ouverture et à chaque message reçu, les notifications de message sont marquées lues. */
export function ThreadPane({ friend, currentUserId, listPath, profilePath }: ThreadPaneProps) {
  const { messages, error, send, refresh } = useThread(friend.user_id);
  const name = friend.username ?? MESSAGES_LABELS.unknownUser;

  // Relancé à l'arrivée du fil puis à chaque nouveau message de l'ami, pas à chaque relecture.
  const loaded = messages !== null;
  const last = messages?.[messages.length - 1];
  const lastReceivedId = last && last.sender_id === friend.user_id ? last.message_id : null;
  useEffect(() => {
    if (!loaded) return;
    markMessageNotificationsRead()
      .then((count) => {
        if (count > 0) window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
      })
      .catch(() => undefined);
  }, [loaded, lastReceivedId]);

  return (
    <div className={styles.pane}>
      <header className={styles.bar}>
        <Link to={listPath} className={styles.back} aria-label={MESSAGES_LABELS.backToList}>
          <Icon name="chevronLeft" size={22} />
        </Link>
        <Avatar name={name} src={friend.profile_picture} size={40} />
        <div className={styles.who}>
          <h2 className={styles.name}>@{name}</h2>
          <Link to={profilePath(friend.user_id)} className={styles.profile}>
            {MESSAGES_LABELS.viewProfile}
          </Link>
        </div>
      </header>

      {error && (
        <div className={styles.state}>
          <p>{error.status === 403 ? MESSAGES_LABELS.errors.notFriends : MESSAGES_LABELS.loadFailed}</p>
          {error.status !== 403 && (
            <Button variant="secondary" onClick={() => void refresh()}>
              {MESSAGES_LABELS.retry}
            </Button>
          )}
        </div>
      )}
      {!error && messages === null && <p className={styles.state}>{MESSAGES_LABELS.loading}</p>}
      {messages !== null && <MessageThread messages={messages} currentUserId={currentUserId} friendName={name} />}

      <MessageComposer onSend={send} disabled={error?.status === 403} />
    </div>
  );
}
