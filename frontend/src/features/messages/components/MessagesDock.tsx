import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { useAuth } from '@/features/auth';
import { friendsApi, type FriendUserSummary } from '@/features/friends';
import { useResource } from '@/shared/hooks/useResource';
import { Button, Icon } from '@/shared/ui';
import { MESSAGES_LABELS } from '../labels';
import { ConversationList } from './ConversationList';
import { ThreadPane } from './ThreadPane';
import styles from './MessagesDock.module.css';

type MessagesDockProps = {
  id: string;
  /** Page complète (`/messages`), proposée dans la barre. */
  fullPagePath: string;
  profilePath: (userId: string) => string;
  onClose: () => void;
};

const text = MESSAGES_LABELS;

/** Le volet : liste des amis, puis le fil choisi (retour par chevron) ; Échap ferme. Monté seulement ouvert. */
export function MessagesDock({ id, fullPagePath, profilePath, onClose }: MessagesDockProps) {
  const { user } = useAuth();
  const panel = useRef<HTMLElement>(null);
  const [friend, setFriend] = useState<FriendUserSummary | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback((signal: AbortSignal) => friendsApi.getMyFriends(signal), []);
  const { data: friends, error, loading, reload } = useResource(load);
  const sorted = useMemo(
    () => [...(friends ?? [])].sort((a, b) => (a.username ?? '').localeCompare(b.username ?? '')),
    [friends],
  );

  useEffect(() => {
    panel.current?.focus();
  }, []);

  useEffect(() => {
    const handleUserDeleted = (event: Event) => {
      const { userId } = (
        event as CustomEvent<{ userId: string }>
      ).detail;

      setFriend((current) =>
        current?.user_id === userId ? null : current,
      );
    };

    window.addEventListener('user:deleted', handleUserDeleted);

    return () => {
      window.removeEventListener('user:deleted', handleUserDeleted);
    };
  }, []);

  useEffect(() => {
    const handleUserStatusChanged = (event: Event) => {
      const { userId, accountStatus } = (
        event as CustomEvent<{
          userId: string;
          accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
        }>
      ).detail;

      if (accountStatus === 'ACTIVE') return;

      if (friend?.user_id !== userId) return;

      setNotice(
        accountStatus === 'SUSPENDED'
          ? 'Blocked user — messages unavailable.'
          : 'Messages unavailable for this user.',
      );

      setFriend(null);
    };

    window.addEventListener(
      'user:status-changed',
      handleUserStatusChanged,
    );

    return () => {
      window.removeEventListener(
        'user:status-changed',
        handleUserStatusChanged,
      );
    };
  }, [friend?.user_id]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    onClose();
  };

  useEffect(() => {
    const handleUnavailable = (event: Event) => {
      const { friendId } = (
        event as CustomEvent<{ friendId: string }>
      ).detail;

      setFriend((current) =>
        current?.user_id === friendId ? null : current,
      );

      setNotice((current) =>
        current ?? 'Messages unavailable for this user.',
      );

      reload();
    };

    window.addEventListener(
      'conversation:unavailable',
      handleUnavailable,
    );

    return () => {
      window.removeEventListener(
        'conversation:unavailable',
        handleUnavailable,
      );
    };
  }, [reload]);

  return createPortal(
    <section
      ref={panel}
      id={id}
      className={styles.dock}
      role="dialog"
      aria-modal="false"
      aria-label={text.title}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.bar}>
        <h2 className={styles.title}>{text.title}</h2>
        <Link to={fullPagePath} className={styles.iconButton} aria-label={text.dock.fullPage} title={text.dock.fullPage} onClick={onClose}>
          <Icon name="arrow" size={18} />
        </Link>
        <button type="button" className={styles.iconButton} aria-label={text.dock.close} title={text.dock.close} onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      </div>

      <div className={styles.body}>
        {notice && (
          <p className={styles.state} role="status">
            {notice}
          </p>
        )}
        {friend && user ? (
          <ThreadPane
            key={friend.user_id}
            friend={friend}
            currentUserId={user.user_id}
            profilePath={profilePath}
            onBack={() => setFriend(null)}
          />
        ) : (
          <>
            {loading && <p className={styles.state}>{text.loading}</p>}
            {error && (
              <div className={styles.state}>
                <p>{text.loadFailed}</p>
                <Button variant="secondary" onClick={reload}>
                  {text.retry}
                </Button>
              </div>
            )}
            {friends && friends.length === 0 && (
              <div className={styles.state}>
                <p>{text.noFriends.text}</p>
              </div>
            )}
            {friends && friends.length > 0 && <ConversationList friends={sorted} activeId={null} onSelect={(selected) => {
              setNotice(null);
              setFriend(selected);
            }}/>}
          </>
        )}
      </div>
    </section>,
    document.body,
  );
}
