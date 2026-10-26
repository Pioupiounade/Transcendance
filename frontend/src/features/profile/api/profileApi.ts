import { http } from '@/shared/api';
import { friendsApi, type FriendRequestItem, type FriendUserSummary } from '@/features/friends';
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

/** `GET /organization-members/user/:id/organizations` : mes adhésions, avec le rôle et l'état de l'organisation. */
type ApiMembership = {
  role: 'OWNER' | 'MANAGER' | 'MEMBER';
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BANNED';
  organization: {
    organization_id: string;
    title: string;
    organization_status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
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

export async function getMyInterests(signal?: AbortSignal): Promise<InterestCategory[]> {
  const rows = await http.get<ApiUserInterest[]>('/interests/me', { signal });
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
  is_online?: boolean;
};

type ApiUnavailablePublicProfile = {
  available: false;
  reason: 'ACCOUNT_DEACTIVATED' | 'ACCOUNT_SUSPENDED' | 'PROFILE_UNAVAILABLE';
  user_id: string;
};

export type UnavailablePublicProfile = {
  available: false;
  reason: 'ACCOUNT_DEACTIVATED' | 'ACCOUNT_SUSPENDED' | 'PROFILE_UNAVAILABLE';
  userId: string;
};

export type PublicProfileResult = PublicProfile | UnavailablePublicProfile;

export function isUnavailablePublicProfile(data: PublicProfileResult): data is UnavailablePublicProfile {
  return 'available' in data && data.available === false;
}

export async function getPublicProfile(userId: string, signal?: AbortSignal): Promise<PublicProfileResult> {
  const data = await http.get<ApiPublicProfile | ApiUnavailablePublicProfile>(
    `/profiles/${encodeURIComponent(userId)}`,
    { signal },
  );

  if ('available' in data && data.available === false) {
    return { available: false, reason: data.reason, userId: data.user_id };
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
    is_online: profile.is_online,
  };
}

export async function getProfile(signal?: AbortSignal): Promise<UserProfile | null> {
  const data = await http.get<ApiProfile | null>('/profiles/me', { signal });
  if (!data) return null;

  return {
    username: data.username,
    commune: data.commune,
    description: data.description ?? undefined,
    profilePicture: data.profile_picture ?? undefined,
    visibility: data.visibility,
    location: data.location?.length === 2 ? { latitude: data.location[0], longitude: data.location[1] } : null,
  };
}

export async function getCurrentUserSummary(signal?: AbortSignal): Promise<{ userId: string; points: number }> {
  const account = await http.get<ApiAccount>('/users/me', { signal });
  return { userId: account.user_id, points: account.points };
}

const getMyMemberships = (userId: string, signal?: AbortSignal) =>
  http.list<ApiMembership>(`/organization-members/user/${encodeURIComponent(userId)}/organizations`, { signal });

export async function getProfileOrganizations(userId: string, signal?: AbortSignal): Promise<ProfileOrganization[]> {
  const memberships = await getMyMemberships(userId, signal);
  return memberships
    .filter((membership) => membership.status === 'ACTIVE')
    .map(({ organization }) => ({ id: organization.organization_id, title: organization.title }));
}

/** Vrai si je possède une organisation active : le backend refuse alors la désactivation du compte. */
export async function ownsActiveOrganization(signal?: AbortSignal): Promise<boolean> {
  const { userId } = await getCurrentUserSummary(signal);
  const memberships = await getMyMemberships(userId, signal);
  return memberships.some(
    (membership) =>
      membership.role === 'OWNER' &&
      membership.status === 'ACTIVE' &&
      membership.organization.organization_status === 'ACTIVE',
  );
}

export async function getProfileParticipations(signal?: AbortSignal): Promise<ProfileParticipation[]> {
  const participations = await http.list<ApiParticipation>('/participations/me', { signal });
  return participations.map((participation) => ({ actionId: participation.action_id, title: participation.title }));
}

export async function getProfileActivity(signal?: AbortSignal): Promise<ProfileActivity> {
  const { userId, points } = await getCurrentUserSummary(signal);
  const [organizations, participations] = await Promise.all([
    getProfileOrganizations(userId, signal),
    getProfileParticipations(signal),
  ]);
  return { points, organizations, participations };
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const result = await http.get<{ available: boolean }>('/profiles/username-available', { query: { username } });
  return result.available;
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
    location: profile.location ? [profile.location.latitude, profile.location.longitude] : undefined,
  });

  if (avatar) await uploadAvatar(avatar);

  const savedProfile = await getProfile();
  if (!savedProfile) {
    throw new Error('Profile not found after save');
  }
  return savedProfile;
}

/* Amitié depuis le profil public : la feature friends expose les routes, le profil traduit en `FriendshipStatus`. */

const requesterId = (request: FriendRequestItem): string | undefined => request.requester?.user_id;
const addresseeId = (request: FriendRequestItem): string | undefined => request.addressee?.user_id;

export async function getFriendshipStatus(targetUserId: string, signal?: AbortSignal): Promise<FriendshipStatus> {
  const [friends, sentRequests, receivedRequests, relation] = await Promise.all([
    friendsApi.getMyFriends(signal),
    friendsApi.getSentRequests(signal),
    friendsApi.getReceivedRequests(signal),
    friendsApi.getFriendshipStatus(targetUserId),
  ]);

  if (relation.status === 'BLOCKED_BY_ME') return 'BLOCKED';
  if (relation.status === 'BLOCKED_BY_OTHER') return 'BLOCKED_BY_OTHER';
  if (relation.status === 'ACCEPTED') return 'ACCEPTED';
  if (sentRequests.some((request) => addresseeId(request) === targetUserId)) return 'PENDING_SENT';
  if (receivedRequests.some((request) => requesterId(request) === targetUserId)) return 'PENDING_RECEIVED';
  if (friends.some((friend: FriendUserSummary) => friend.user_id === targetUserId)) return 'ACCEPTED';
  return 'NONE';
}

export async function sendFriendRequest(targetUserId: string): Promise<FriendshipStatus> {
  await friendsApi.sendFriendRequest(targetUserId);
  return 'PENDING_SENT';
}

export async function acceptFriendRequest(targetUserId: string): Promise<FriendshipStatus> {
  const received = await friendsApi.getReceivedRequests();
  const request = received.find((item) => requesterId(item) === targetUserId);
  if (request) await friendsApi.acceptFriendRequest(request.friend_request_id);
  return 'ACCEPTED';
}

export async function declineFriendRequest(targetUserId: string): Promise<FriendshipStatus> {
  const received = await friendsApi.getReceivedRequests();
  const request = received.find((item) => requesterId(item) === targetUserId);
  if (request) await friendsApi.rejectFriendRequest(request.friend_request_id);
  return 'NONE';
}

export async function cancelOrRemoveFriend(targetUserId: string): Promise<FriendshipStatus> {
  const sentRequests = await friendsApi.getSentRequests();
  const pendingRequest = sentRequests.find((request) => addresseeId(request) === targetUserId);

  if (pendingRequest) {
    await http.delete<void>(`/friend-requests/${pendingRequest.friend_request_id}`);
    return 'NONE';
  }

  await friendsApi.removeFriend(targetUserId);
  return 'NONE';
}

export async function unblockUser(targetUserId: string): Promise<FriendshipStatus> {
  await friendsApi.unblockFriend(targetUserId);
  return 'NONE';
}

export async function deactivateAccount(): Promise<void> {
  await http.patch('/users/me/deactivate');
}
