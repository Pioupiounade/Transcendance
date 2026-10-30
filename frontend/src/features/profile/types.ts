export type ProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';

export type FriendshipStatus =
  | 'NONE'
  | 'PENDING_SENT'
  | 'PENDING_RECEIVED'
  | 'ACCEPTED'
  | 'BLOCKED'
  | 'BLOCKED_BY_OTHER';

export type InterestCategory =
  | 'ENV_FLOWER_POWER'
  | 'ENV_CLEAN'
  | 'ENV_DO'
  | 'SOCIAL_SHARE'
  | 'SOCIAL_MEET'
  | 'SOCIAL_DO'
  | 'CULTURAL_LEARN'
  | 'CULTURAL_CREATE'
  | 'CULTURAL_DO';
  
export interface UserProfile {
  username: string;
  location: { latitude: number; longitude: number } | null;
  description?: string;
  visibility: ProfileVisibility;
  profilePicture?: string;
  friendshipStatus?: FriendshipStatus;
  commune?: string | null;
  isOnline?: boolean;
}

export interface PublicProfile {
  userId: string;
  username: string;
  description: string | null;
  profilePicture: string | null;
  commune: string | null;
  interests: InterestCategory[];
  visibility?: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
  isPrivate?: boolean;
  is_online?: boolean;
  adminView?: boolean;
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
}

export interface ProfileOrganization {
  id: string;
  title: string;
}

export interface ProfileParticipation {
  actionId: string;
  title: string;
}

export interface ProfileActivity {
  points: number;
  organizations: ProfileOrganization[];
  participations: ProfileParticipation[];
}