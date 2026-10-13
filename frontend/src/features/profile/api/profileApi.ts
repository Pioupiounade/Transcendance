import { useEffect, useState } from 'react';
import { http } from '@/shared/api';
import { friendsApi } from '@/features/friends/api/friendsApi';
import type {
  PublicProfile,
  InterestCategory,
  ProfileActivity,
  ProfileOrganization,
  ProfileParticipation,
  ProfileVisibility,
  UserProfile,
  FriendshipStatus,
} from '../types';

type ApiProfile = {
  user_id: string;
  username: string;
  description: string | null;
  profile_picture: string | null;
  location: number[] | null;
  visibility: ProfileVisibility;
  commune: string | null;
};

type ApiAccount = {
  user_id: string;
  points: number;
};

type ApiMembership = {
  organization: {
    organization_id: string;
    title: string;
  };
};

type ApiParticipation = {
  action_id: string;
  title: string;
};

type ApiUserInterest = {
  user_id: string;
  interest: InterestCategory;
};

export async function getMyInterests(): Promise<InterestCategory[]> {
  const rows = await http.get<ApiUserInterest[]>('/interests/me');
  return rows.map((row) => row.interest);
}

export async function selectInterest(interest: InterestCategory): Promise<void> {
  await http.patch('/interests/me/select', { interest });
}

export async function removeInterest(interest: InterestCategory): Promise<void> {
  await http.patch('/interests/me/remove', { interest });
}

export async function uploadAvatar(file: File): Promise<void> {
  const body = new FormData();
  body.append('file', file);
  await http.patch('/profiles/me/avatar', body);
}

type ApiPublicProfile = {
  user_id: string;
  username: string;
  description: string | null;
  profile_picture: string | null;
  commune: string | null;
  interests: InterestCategory[];
  visibility?: ProfileVisibility;
  isPrivate?: boolean;
};

type ApiUnavailablePublicProfile = {
  available: false;
  reason: 'ACCOUNT_DEACTIVATED' | 'ACCOUNT_SUSPENDED';
  user_id: string;
};

export type UnavailablePublicProfile = {
  available: false;
  reason: 'ACCOUNT_DEACTIVATED' | 'ACCOUNT_SUSPENDED';
  userId: string;
};

export type PublicProfileResult =
  | PublicProfile
  | UnavailablePublicProfile;

export function isUnavailablePublicProfile(
  data: PublicProfileResult,
): data is UnavailablePublicProfile {
  return 'available' in data && data.available === false;
}

export async function getPublicProfile(
  userId: string,
): Promise<PublicProfileResult> {
    const data = await http.get<
    ApiPublicProfile | ApiUnavailablePublicProfile
  >(`/profiles/${encodeURIComponent(userId)}`);

  if ('available' in data && data.available === false) {
    return {
      available: false,
      reason: data.reason,
      userId: data.user_id,
    };
  }

  const profile = data as ApiPublicProfile;

  return {
    userId: profile.user_id,
    username: profile.username,
    description: profile.description,
    profilePicture: profile.profile_picture,
    commune: profile.commune,
    interests: profile.interests,
    visibility: profile.visibility,
    isPrivate: profile.isPrivate,
  };
}

export async function getProfile(): Promise<UserProfile | null> {
  const data = await http.get<ApiProfile | null>('/profiles/me');

  if (!data) {
    return null;
  }

  return {
    username: data.username,
    commune: data.commune,
    description: data.description ?? undefined,
    profilePicture: data.profile_picture ?? undefined,
    visibility: data.visibility,
    location:
      data.location?.length === 2
        ? { latitude: data.location[0], longitude: data.location[1] }
        : null,
  };
}

export async function getCurrentUserSummary(): Promise<{ userId: string; points: number }> {
  const account = await http.get<ApiAccount>('/users/me');

  return {
    userId: account.user_id,
    points: account.points,
  };
}

export async function getProfileOrganizations(userId: string): Promise<ProfileOrganization[]> {
  const memberships = await http.get<ApiMembership[]>(
    `/organization-members/user/${encodeURIComponent(userId)}/organizations`,
  );

  return memberships.map(({ organization }) => ({
    id: organization.organization_id,
    title: organization.title,
  }));
}

export async function getProfileParticipations(): Promise<ProfileParticipation[]> {
  const participations = await http.get<ApiParticipation[]>('/participations/me');

  return participations.map((participation) => ({
    actionId: participation.action_id,
    title: participation.title,
  }));
}

export async function getProfileActivity(): Promise<ProfileActivity> {
  const { userId, points } = await getCurrentUserSummary();

  const [organizations, participations] = await Promise.all([
    getProfileOrganizations(userId),
    getProfileParticipations(),
  ]);

  return { points, organizations, participations };
}

export async function createProfile(profile: UserProfile, avatar?: File | null): Promise<UserProfile> {
  if (!profile.location) {
    throw new Error('Location is required to create a profile');
  }

  await http.post('/profiles', {
    username: profile.username,
    description: profile.description,
    visibility: profile.visibility,
    location: [profile.location.latitude, profile.location.longitude],
  });

  if (avatar) await uploadAvatar(avatar);
  
  const savedProfile = await getProfile();

if (!savedProfile) {
  throw new Error('Profile not found after save');
}

return savedProfile;
}

export async function updateProfile(profile: UserProfile, avatar?: File | null): Promise<UserProfile> {
  await http.patch('/profiles/me', {
    username: profile.username,
    description: profile.description,
    visibility: profile.visibility,
    location: profile.location
      ? [profile.location.latitude, profile.location.longitude]
      : undefined,
  });

  if (avatar) await uploadAvatar(avatar);
  
  const savedProfile = await getProfile();

  if (!savedProfile) {
    throw new Error('Profile not found after save');
  }

  return savedProfile;
}

export async function sendFriendRequest(targetUserId: string): Promise<FriendshipStatus> {
  await friendsApi.sendFriendRequest(targetUserId);
  return 'PENDING_SENT';
}

export async function acceptFriendRequest(targetUserId: string): Promise<FriendshipStatus> {
  const received = await friendsApi.getReceivedRequests();
  const req = received.find((r: any) => {
    const senderId = r.requester_id ?? r.requester?.user_id ?? r.requester?.id ?? r.requester?.userId;
    return String(senderId) === String(targetUserId);
  });

  if (req) {
    await friendsApi.acceptFriendRequest(req.friend_request_id);
  }
  return 'ACCEPTED';
}

export async function declineFriendRequest(targetUserId: string): Promise<FriendshipStatus> {
  const received = await friendsApi.getReceivedRequests();
  const req = received.find((r: any) => {
    const senderId = r.requester_id ?? r.requester?.user_id ?? r.requester?.id ?? r.requester?.userId;
    return String(senderId) === String(targetUserId);
  });

  if (req) {
    await friendsApi.rejectFriendRequest(req.friend_request_id);
  }
  return 'NONE';
}

export async function cancelOrRemoveFriend(
  targetUserId: string,
): Promise<FriendshipStatus> {
  const sentRequests = await http.get<any[]>(
    '/friend-requests/sentRequests',
  );

  const pendingRequest = sentRequests.find(
    (request) =>
      String(request.addressee?.user_id) === String(targetUserId),
  );

  if (pendingRequest) {
    await http.delete<void>(
      `/friend-requests/${pendingRequest.friend_request_id}`,
    );

    return 'NONE';
  }

  await http.delete<void>(`/friendships/${targetUserId}`);

  return 'NONE';
}

export async function unblockUser(targetUserId: string): Promise<FriendshipStatus> {
  await friendsApi.unblockFriend(targetUserId);
  return 'NONE';
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);

    if (userId) {
      getPublicProfile(userId)
        .then((data) => {
          if (!isMounted) return;

          if (isUnavailablePublicProfile(data)) {
            setProfile(null);
            return;
          }

          setUserProfileState(data, setProfile);
        })
        .catch((err) => {
          if (isMounted) {
            setError(err as Error);
            setProfile(null);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    } else {
      getProfile()
        .then((data) => {
          if (!isMounted) return;
          setProfile(data);
        })
        .catch((err) => {
          if (isMounted) {
            setError(err as Error);
            setProfile(null);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { profile, isLoading, error, setProfile };
}

function setUserProfileState(
  data: PublicProfile,
  setProfile: (profile: UserProfile | null) => void,
) {
  setProfile({
    username: data.username,
    commune: data.commune,
    description: data.description ?? undefined,
    profilePicture: data.profilePicture ?? undefined,
    visibility: (data.visibility as ProfileVisibility) ?? 'PUBLIC',
    location: null,
  });
}

export async function deactivateAccount(): Promise<void> {
  await http.patch('/users/me/deactivate');
}