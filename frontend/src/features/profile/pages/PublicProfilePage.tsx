import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router';
import { useAuth } from '@/features/auth';
import { getPublicProfile } from '../api/profileApi';
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

    Promise.all([
      getPublicProfile(userId),
      friendsApi.getMyFriends(),
      friendsApi.getSentRequests(),
      friendsApi.getReceivedRequests(),
    ])
      .then(([data, friends, sentRequests, receivedRequests]: any[]) => {
        if (!active) return;

        // Détection de la visibilité restreinte depuis le DTO backend
        if (
          data.isPrivate ||
          data.visibility === 'PRIVATE' ||
          data.visibility === 'FRIENDS_ONLY'
        ) {
          setIsPrivate(true);
          return;
        }

        let friendshipStatus: FriendshipStatus = 'NONE';

        if (friends.some((friend: any) => String(friend.user_id) === String(userId))) {
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
          username: data.username,
          description: data.description ?? undefined,
          profilePicture: data.profile_picture ?? data.profilePicture ?? undefined,
          commune: data.commune ?? null,
          visibility: data.visibility ?? 'PUBLIC',
          location: null,
          friendshipStatus,
        });
        setUserInterests(data.interests ?? []);
      })
      .catch((err) => {
        if (!active) return;
        if (err?.status === 403 || err?.status === 404) {
          setIsPrivate(true);
        } else {
          setError(true);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  // Redirection synchrone immédiate si c'est son propre profil
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
      onEdit={() => { }}
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