import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth';
import { isApiError } from '@/shared/api';
import { useResource } from '@/shared/hooks/useResource';
import { pageTitle } from '@/shared/lib/pageTitle';
import { ButtonLink, Icon } from '@/shared/ui';
import { getFriendshipStatus, getPublicProfile, isUnavailablePublicProfile } from '../api/profileApi';
import { FriendshipCTA } from '../components/FriendshipCTA';
import { ProfileSkeleton } from '../components/ProfileSkeleton';
import { ProfileUnavailable, type UnavailableReason } from '../components/ProfileUnavailable';
import { ProfileView } from '../components/ProfileView';
import { PROFILE_LABELS } from '../labels';
import type { FriendshipStatus, PublicProfile } from '../types';
import styles from './ProfilePage.module.css';

type PublicProfilePageProps = {
  /** Mon propre profil : on y renvoie quand l'id est le mien. */
  ownProfilePath: string;
  /** Fil de messages avec ce voisin (ami seulement). */
  messagePath: (userId: string) => string;
};

type PublicView =
  | { kind: 'profile'; profile: PublicProfile; friendship: FriendshipStatus }
  | { kind: 'unavailable'; reason: UnavailableReason };

const text = PROFILE_LABELS;

/** Un voisin peut aussi ne pas être visible pour moi : les 403 / 404 du profil sont un cas normal, pas une erreur. */
const toView = async (userId: string, signedIn: boolean, signal: AbortSignal): Promise<PublicView> => {
  try {
    const data = await getPublicProfile(userId, signal);
    if (isUnavailablePublicProfile(data)) return { kind: 'unavailable', reason: data.reason };
    if (data.isPrivate || data.visibility === 'PRIVATE') return { kind: 'unavailable', reason: 'PRIVATE' };
    const friendship = signedIn ? await getFriendshipStatus(userId, signal).catch((): FriendshipStatus => 'NONE') : 'NONE';
    return { kind: 'profile', profile: data, friendship };
  } catch (error) {
    if (isApiError(error) && (error.status === 403 || error.status === 404)) {
      return { kind: 'unavailable', reason: 'PRIVATE' };
    }
    throw error;
  }
};

/** `/profiles/:userId` : la fiche publique d'un voisin, avec mon lien d'amitié et sa présence en direct. */
export function PublicProfilePage({ ownProfilePath, messagePath }: PublicProfilePageProps) {
  const { userId = '' } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.user_id ?? null;

  const load = useCallback(
    (signal: AbortSignal) => toView(userId, currentUserId !== null, signal),
    [userId, currentUserId],
  );
  const view = useResource(load);

  // Ce qui a changé depuis le chargement : mon lien d'amitié (boutons), sa présence (socket #164).
  const [friendship, setFriendship] = useState<{ userId: string; status: FriendshipStatus } | null>(null);
  const [presence, setPresence] = useState<{ userId: string; online: boolean } | null>(null);

  useEffect(() => {
    const onPresence = (event: Event) => {
      const { userId: changed, isOnline } = (event as CustomEvent<{ userId: string; isOnline: boolean }>).detail;
      setPresence({ userId: String(changed), online: isOnline });
    };
    window.addEventListener('presence:change', onPresence);
    return () => window.removeEventListener('presence:change', onPresence);
  }, []);

  useEffect(() => {
    const onProfileUpdated = (event: Event) => {
      const { userId: changedUserId } = (
        event as CustomEvent<{ userId: string }>
      ).detail;

      if (String(changedUserId) === userId) {
        void view.reload();
      }
    };

    window.addEventListener('profile:updated', onProfileUpdated);

    return () => {
      window.removeEventListener('profile:updated', onProfileUpdated);
    };
  }, [userId, view.reload]);

  useEffect(() => {
    const onFriendshipChanged = (event: Event) => {
      const { userId: changedUserId } = (
        event as CustomEvent<{ userId: string }>
      ).detail;

      if (String(changedUserId) === userId) {
        setFriendship(null);
        void view.reload();
      }
    };

    window.addEventListener('friendship:changed', onFriendshipChanged);

    return () => {
      window.removeEventListener('friendship:changed', onFriendshipChanged);
    };
  }, [userId, view.reload]);

  if (currentUserId !== null && currentUserId === userId) return <Navigate to={ownProfilePath} replace />;

  let content;
  if (view.loading) {
    content = <ProfileSkeleton />;
  } else if (view.error || !view.data) {
    content = <ProfileUnavailable reason="ERROR" onRetry={view.reload} />;
  } else if (view.data.kind === 'unavailable') {
    content = <ProfileUnavailable reason={view.data.reason} />;
  } else {
    const { profile } = view.data;
    const status = friendship?.userId === userId ? friendship.status : view.data.friendship;
    const online = presence?.userId === userId ? presence.online : profile.is_online;

    content = (
      <ProfileView
        profile={{
          username: profile.username,
          description: profile.description ?? undefined,
          profilePicture: profile.profilePicture ?? undefined,
          commune: profile.commune,
          visibility: profile.visibility ?? 'PUBLIC',
          location: null,
        }}
        eyebrow={text.neighbour}
        own={false}
        interests={{ data: profile.interests, loading: false, error: null }}
        online={online}
        actions={
          currentUserId !== null && (
            <>
              {status === 'ACCEPTED' && (
                <ButtonLink to={messagePath(userId)}>
                  <Icon name="chat" size={16} />
                  {text.hero.message}
                </ButtonLink>
              )}
              <FriendshipCTA
                userId={userId}
                status={status}
                onStatusChange={(next) => setFriendship({ userId, status: next })}
              />
            </>
          )
        }
      />
    );
  }

  return (
    <section className={styles.page}>
      <title>{pageTitle(view.data?.kind === 'profile' ? `@${view.data.profile.username}` : text.neighbour)}</title>
      {content}
    </section>
  );
}
