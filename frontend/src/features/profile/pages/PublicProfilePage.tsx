import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router';
import { getPublicProfile, getCurrentUserSummary } from '../api/profileApi';
import { ProfileView } from '../components/ProfileView';
import type { FriendshipStatus, InterestCategory, UserProfile } from '../types';

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userInterests, setUserInterests] = useState<InterestCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getCurrentUserSummary()
      .then((account) => setCurrentUserId(String(account.userId)))
      .catch(() => setCurrentUserId(null));
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(false);
    setUserProfile(null);
    setUserInterests([]);

    if (!userId) {
      setError(true);
      setIsLoading(false);
      return;
    }

    getPublicProfile(userId)
      .then((data) => {
        if (!active) return;
        setUserProfile({
          id: data.userId,
          username: data.username,
          description: data.description ?? undefined,
          profilePicture: data.profilePicture ?? undefined,
          commune: data.commune ?? null,
          visibility: 'PUBLIC',
          location: null,
          friendshipStatus: 'NONE',
        });
        setUserInterests(data.interests ?? []);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (currentUserId && userId && String(currentUserId) === String(userId)) {
    return <Navigate to="/profile" replace />;
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <p className="help" style={{ justifyContent: 'center' }}>Loading profile...</p>
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
      isOwnProfile={false}
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