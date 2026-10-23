import { Link } from 'react-router';
import type { FriendUserSummary } from '@/features/friends';
import { Avatar } from '@/shared/ui';
import { MESSAGES_LABELS } from '../labels';
import styles from './ConversationList.module.css';

type ConversationListProps = {
  friends: FriendUserSummary[];
  activeId: string | null;
  threadPath: (friendId: string) => string;
};

/** Une conversation par ami actif (le backend ne liste pas les fils) ; l'ami ouvert est en noir. */
export function ConversationList({ friends, activeId, threadPath }: ConversationListProps) {
  return (
    <nav className={styles.list} aria-label={MESSAGES_LABELS.conversations}>
      <ul className={styles.items}>
        {friends.map((friend) => {
          const name = friend.username ?? MESSAGES_LABELS.unknownUser;
          const active = friend.user_id === activeId;
          return (
            <li key={friend.user_id}>
              <Link
                to={threadPath(friend.user_id)}
                className={styles.item}
                aria-current={active ? 'page' : undefined}
              >
                <Avatar name={name} src={friend.profile_picture} size={40} />
                <span className={styles.name}>@{name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
