import { useState } from 'react';
import { Button, Icon } from '@/shared/ui';
import {
  acceptFriendRequest,
  cancelOrRemoveFriend,
  declineFriendRequest,
  sendFriendRequest,
  unblockUser,
} from '../api/profileApi';
import { PROFILE_LABELS } from '../labels';
import type { FriendshipStatus } from '../types';
import styles from './FriendshipCTA.module.css';

type FriendshipCTAProps = {
  userId: string;
  /** Relation actuelle : le parent la possède et la met à jour via `onStatusChange`. */
  status: FriendshipStatus;
  onStatusChange: (next: FriendshipStatus) => void;
};

const text = PROFILE_LABELS.friendship;

/** Mon lien avec ce voisin : ajouter, accepter / refuser, retirer, débloquer. Une seule action à la fois. */
export function FriendshipCTA({ userId, status, onStatusChange }: FriendshipCTAProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (action: (targetUserId: string) => Promise<FriendshipStatus>) => async () => {
    setPending(true);
    setError(null);
    try {
      onStatusChange(await action(userId));
    } catch {
      setError(text.failed);
    } finally {
      setPending(false);
    }
  };

  let content;
  switch (status) {
    case 'BLOCKED_BY_OTHER':
      content = <span className={styles.badge}>{text.unavailable}</span>;
      break;
    case 'BLOCKED':
      content = (
        <>
          <span className={styles.badge}>
            <Icon name="lock" size={14} />
            {text.blocked}
          </span>
          <Button variant="secondary" onClick={run(unblockUser)} disabled={pending}>
            {text.unblock}
          </Button>
        </>
      );
      break;
    case 'PENDING_SENT':
      content = (
        <span className={styles.badge}>
          <Icon name="clock" size={14} />
          {text.sent}
        </span>
      );
      break;
    case 'PENDING_RECEIVED':
      content = (
        <>
          <Button onClick={run(acceptFriendRequest)} disabled={pending}>
            <Icon name="check" size={16} strokeWidth={2.2} />
            {text.accept}
          </Button>
          <Button variant="secondary" onClick={run(declineFriendRequest)} disabled={pending}>
            {text.decline}
          </Button>
        </>
      );
      break;
    case 'ACCEPTED':
      content = (
        <>
          <span className={[styles.badge, styles.friends].join(' ')}>
            <Icon name="check" size={14} strokeWidth={2.4} />
            {text.friends}
          </span>
          <Button variant="secondary" onClick={run(cancelOrRemoveFriend)} disabled={pending}>
            {text.unfriend}
          </Button>
        </>
      );
      break;
    default:
      content = (
        <Button onClick={run(sendFriendRequest)} disabled={pending}>
          <Icon name="plus" size={16} strokeWidth={2.2} />
          {text.add}
        </Button>
      );
  }

  return (
    <div className={styles.cta} aria-busy={pending || undefined}>
      {content}
      {error && (
        <p className={styles.error} role="alert">
          <Icon name="alert" size={14} strokeWidth={2.4} />
          {error}
        </p>
      )}
    </div>
  );
}
