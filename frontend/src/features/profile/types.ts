export type ProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';

export type FriendshipStatus = 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'BLOCKED';

export interface UserProfile {
  id: string;
  username: string;
  location: { latitude: number; longitude: number } | null;
  description?: string;
  visibility: ProfileVisibility;
  profilePicture?: string;
  friendshipStatus?: FriendshipStatus;
}