import { Link } from 'react-router';
import type { FriendUserSummary } from '@/features/friends';
import { Avatar } from '@/shared/ui';
import { MESSAGES_LABELS } from '../labels';
import styles from './ConversationList.module.css';

type ConversationListProps = {
  friends: FriendUserSummary[];
  activeId: string | null;
} & (
  | { /** Page : chaque ami est un lien vers son fil. */ threadPath: (friendId: string) => string; onSelect?: never }
  | { /** Volet : chaque ami est un bouton, le fil s'ouvre sur place. */ onSelect: (friend: FriendUserSummary) => void; threadPath?: never }
);

/** Une conversation par ami actif (le backend ne liste pas les fils) ; l'ami ouvert est en noir. */
export function ConversationList({ friends, activeId, ...mode }: ConversationListProps) {
  return (
    <nav className={styles.list} aria-label={MESSAGES_LABELS.conversations}>
      <ul className={styles.items}>
        {friends.map((friend) => {
          const name = friend.username ?? MESSAGES_LABELS.unknownUser;
          const active = friend.user_id === activeId;
          const content = (
            <>
              <Avatar name={name} src={friend.profile_picture} size={40} />
              <span className={styles.name}>@{name}</span>
            </>
          );
          return (
            <li key={friend.user_id}>
              {mode.onSelect ? (
                <button
                  type="button"
                  className={styles.item}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => mode.onSelect(friend)}
                >
                  {content}
                </button>
              ) : (
                <Link to={mode.threadPath(friend.user_id)} className={styles.item} aria-current={active ? 'page' : undefined}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
