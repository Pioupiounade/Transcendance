import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router';
import { useAuth } from '@/features/auth';
import {
  getPublicProfile,
  isUnavailablePublicProfile,
} from '../api/profileApi';
import { ProfileView } from '../components/ProfileView';
import type { FriendshipStatus, InterestCategory, UserProfile } from '../types';
import { friendsApi } from '@/features/friends/api/friendsApi';

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const currentUserId = user?.user_id ? String(user.user_id) : null;

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userInterests, setUserInterests] = useState<InterestCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState(false);

  const [unavailableReason, setUnavailableReason] = useState<
    | 'PROFILE_UNAVAILABLE'
    | 'ACCOUNT_DEACTIVATED'
    | 'ACCOUNT_SUSPENDED'
    | null
  >(null);

  useEffect(() => {
    let active = true;
    setUnavailableReason(null);
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
        // Le profil public est accessible même sans connexion.
        const data = await getPublicProfile(userId!);

        if (!active) return;

        if (isUnavailablePublicProfile(data)) {
          setUnavailableReason(data.reason);
          return;
        }

        if (
          data.isPrivate ||
          data.visibility === 'PRIVATE' ||
          data.visibility === 'FRIENDS_ONLY'
        ) {
          setIsPrivate(true);
          return;
        }

        let friendshipStatus: FriendshipStatus = 'NONE';

        // Les données d'amitié ne sont utiles que si l'utilisateur est connecté.
        if (currentUserId) {
          const [
            friends,
            sentRequests,
            receivedRequests,
            friendshipRelation,
          ] = await Promise.all([
            friendsApi.getMyFriends(),
            friendsApi.getSentRequests(),
            friendsApi.getReceivedRequests(),
            friendsApi.getFriendshipStatus(userId!),
          ]);

          if (!active) return;

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
          } else if (
            friends.some(
              (friend: any) =>
                String(friend.user_id ?? friend.friend?.user_id) ===
                String(userId),
            )
          ) {
            friendshipStatus = 'ACCEPTED';
          }
        }

        setUserProfile({
          username: data.username,
          description: data.description ?? undefined,
          profilePicture:
            (data as any).profile_picture ??
            data.profilePicture ??
            undefined,
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

  if (unavailableReason === 'ACCOUNT_DEACTIVATED') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Profile deactivated</h2>
        <p className="help" style={{ justifyContent: 'center' }}>
          This account is no longer active.
        </p>
      </div>
    );
  }

  if (unavailableReason === 'ACCOUNT_SUSPENDED') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Profile unavailable</h2>
        <p className="help" style={{ justifyContent: 'center' }}>
          This account is currently unavailable.
        </p>
      </div>
    );
  }

  if (unavailableReason === 'PROFILE_UNAVAILABLE') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Profile not found</h2>
        <p className="help" style={{ justifyContent: 'center' }}>
          Public profile unavailable.
        </p>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2>Profile unavailable</h2>
        <p className="help" style={{ justifyContent: 'center' }}>
          This profile does not exist or is not publicly accessible.
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