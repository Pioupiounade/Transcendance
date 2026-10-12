import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router';
import { useAuth } from '@/features/auth';
import { getPublicProfile } from '../api/profileApi';
import { ProfileView } from '../components/ProfileView';
import type { FriendshipStatus, InterestCategory, UserProfile } from '../types';
import { friendsApi } from '@/features/friends/api/friendsApi';
import { http } from '@/shared/api';

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.user_id ? String(user.user_id) : null;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userInterests, setUserInterests] = useState<InterestCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(false);
    setIsPrivate(false);
    setUserProfile(null);
    setUserInterests([]);

    if (!userId) {
      setError(true);
      setIsLoading(false);
      return;
    }

    async function loadData() {
      try {
        const targetId = String(userId);

        const profilePromise = getPublicProfile(userId!);
        const relationsPromise = currentUserId
          ? Promise.all([
              http.get<any[]>('/friendships/me').catch(() => []),
              http.get<any[]>('/friend-requests/sentRequests').catch(() => []),
              http.get<any[]>('/friend-requests/receivedRequests').catch(() => []),
            ])
          : Promise.resolve([[], [], []]);

        const [data, [friends, sentRequests, receivedRequests]] = await Promise.all([
          profilePromise,
          relationsPromise,
        ]);

        if (!active) return;

        let resolvedStatus: FriendshipStatus = 'NONE';
        let isFriend = false;

        if (currentUserId) {
          isFriend = friends.some((f) => {
            const fid =
              f.friend?.user_id ??
              f.friend_id ??
              f.user?.user_id ??
              f.user_id ??
              (String(f.user1_id) === String(currentUserId) ? f.user2_id : f.user1_id);
            return String(fid) === targetId;
          });

          if (isFriend) {
            resolvedStatus = 'ACCEPTED';
          } else {
            const isSent = sentRequests.some((r) => {
              const aid = r.addressee_id ?? r.addressee?.user_id ?? r.addresseeId;
              return String(aid) === targetId;
            });

            if (isSent) {
              resolvedStatus = 'PENDING_SENT';
            } else {
              const isReceived = receivedRequests.some((r) => {
                const rid = r.requester_id ?? r.requester?.user_id ?? r.requesterId;
                return String(rid) === targetId;
              });

              if (isReceived) {
                resolvedStatus = 'PENDING_RECEIVED';
              }
            }
          }
        }

        if (data.visibility === 'PRIVATE') {
          setIsPrivate(true);
          return;
        }

        let friendshipStatus: FriendshipStatus = 'NONE';

        if (friendshipRelation.status === 'BLOCKED_BY_ME') {
          friendshipStatus = 'BLOCKED';
        } else if (friendshipRelation.status === 'BLOCKED_BY_OTHER') {
          friendshipStatus = 'BLOCKED_BY_OTHER';
        } else if (friendshipRelation.status === 'ACCEPTED') {
          friendshipStatus = 'ACCEPTED';
        } else if (
          sentRequests.some(
            (request: any) =>
              String(request.addressee?.user_id) === String(userId),
          )
        ) {
          friendshipStatus = 'PENDING_SENT';
        } else if (
          receivedRequests.some(
            (request: any) =>
              String(request.requester?.user_id) === String(userId),
          )
        ) {
          friendshipStatus = 'PENDING_RECEIVED';
        }

        // Profil public complet
        setUserProfile({
          id: String((data as any).user_id ?? data.userId),
          username: data.username,
          description: data.description ?? undefined,
          profilePicture: (data as any).profile_picture ?? data.profilePicture ?? undefined,
          commune: data.commune ?? null,
          visibility: data.visibility ?? 'PUBLIC',
          location: null,
          friendshipStatus,
        });

        setUserInterests(data.interests ?? []);
      } catch (err: any) {
        if (!active) return;
        if (err?.status === 403 || err?.status === 404) {
          setIsPrivate(true);
        } else {
          setError(true);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [userId, currentUserId]);

  if (currentUserId && userId && currentUserId === String(userId)) {
    return <Navigate to="/profile" replace />;
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p className="help" style={{ justifyContent: 'center' }}>Loading profile...</p>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Private Profile</h2>
        <p className="help" style={{ justifyContent: 'center' }}>
          This user has set their profile to private.
        </p>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Profile not found</h2>
        <p className="help help--error" style={{ justifyContent: 'center' }}>
          Public profile unavailable.
        </p>
      </div>
    );
  }

  return (
    <ProfileView
      profile={userProfile}
      userId={userId ?? ''}
      isOwnProfile={false}
      isAuthenticated={Boolean(currentUserId)}
      onEdit={() => {}}
      onFriendshipChange={(newStatus: FriendshipStatus) => {
        setUserProfile((prev) => (prev ? { ...prev, friendshipStatus: newStatus } : null));
      }}
      interests={userInterests}
      interestsLoading={false}
      interestsError={null}
      activity={null}
      activityLoading={false}
      activityError={null}
    />
  );
}