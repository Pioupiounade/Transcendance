import { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth';
import { friendsApi } from '@/features/friends';
import { useResource } from '@/shared/hooks/useResource';
import { pageTitle } from '@/shared/lib/pageTitle';
import { Button, ButtonLink, Icon } from '@/shared/ui';
import { ConversationList } from '../components/ConversationList';
import { ThreadPane } from '../components/ThreadPane';
import { MESSAGES_LABELS } from '../labels';
import styles from './MessagesPage.module.css';

type MessagesPageProps = {
  /** `/messages` : la liste seule (retour depuis un fil sur téléphone). */
  listPath: string;
  threadPath: (friendId: string) => string;
  /** Page des amis, proposée quand on n'en a aucun. */
  friendsPath: string;
  profilePath: (userId: string) => string;
};

const text = MESSAGES_LABELS;

/** Messagerie entre amis : conversations à gauche, fil à droite (`:friendId`), un volet à la fois sur téléphone. */
export function MessagesPage({ listPath, threadPath, friendsPath, profilePath }: MessagesPageProps) {
  const { friendId = null } = useParams<{ friendId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const notice =
    typeof location.state?.message === 'string'
      ? location.state.message
      : null;

  const { user } = useAuth();

  const load = useCallback((signal: AbortSignal) => friendsApi.getMyFriends(signal), []);
  const { data: friends, error, loading, reload } = useResource(load);
  const sorted = useMemo(
    () => [...(friends ?? [])].sort((a, b) => (a.username ?? '').localeCompare(b.username ?? '')),
    [friends],
  );
  const friend = friendId ? (sorted.find((item) => item.user_id === friendId) ?? null) : null;

  useEffect(() => {
    const handleUnavailable = (event: Event) => {
      const { friendId: unavailableId } = (
        event as CustomEvent<{ friendId: string }>
      ).detail;

      reload();

      if (unavailableId === friendId) {
        navigate(listPath, {
          replace: true,
          state: {
            message: 'Messages unavailable for this user.',
          },
        });
      }
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
  }, [friendId, listPath, navigate, reload]);

  useEffect(() => {
    const handleUserStatusChanged = (event: Event) => {
      const { userId, accountStatus } = (
        event as CustomEvent<{
          userId: string;
          accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
        }>
      ).detail;

      if (userId !== friendId || accountStatus === 'ACTIVE') {
        return;
      }

      navigate(listPath, {
        replace: true,
        state: {
          message:
            accountStatus === 'SUSPENDED'
              ? 'Blocked user — messages unavailable.'
              : 'Messages unavailable for this user.',
        },
      });
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
  }, [friendId, listPath, navigate]);

  return (
    <div className={styles.container}>
      <title>{pageTitle(text.title)}</title>
      <h1 className={styles.title}>{text.title}</h1>
        {notice && (
          <p className={styles.state} role="status">
            {notice}
          </p>
        )}

      <div className={styles.panel} data-view={friendId ? 'thread' : 'list'}>
        <aside className={styles.side}>
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
            <div className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <Icon name="users" size={24} />
              </span>
              <h2 className={styles.emptyTitle}>{text.noFriends.title}</h2>
              <p>{text.noFriends.text}</p>
              <ButtonLink to={friendsPath} variant="primary" className={styles.emptyCta}>
                {text.noFriends.cta}
              </ButtonLink>
            </div>
          )}
          {friends && friends.length > 0 && (
            <ConversationList friends={sorted} activeId={friendId} threadPath={threadPath} />
          )}
        </aside>

        <section className={styles.main}>
          {!friendId && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <Icon name="chat" size={24} />
              </span>
              <h2 className={styles.emptyTitle}>{text.pickFriend.title}</h2>
              <p>{text.pickFriend.text}</p>
            </div>
          )}
          {friendId && friends && !friend && <p className={styles.state}>{text.unknownFriend}</p>}
          {friendId && friend && user && (
            <ThreadPane
              key={friend.user_id}
              friend={friend}
              currentUserId={user.user_id}
              listPath={listPath}
              profilePath={profilePath}
            />
          )}
        </section>
      </div>
    </div>
  );
}
