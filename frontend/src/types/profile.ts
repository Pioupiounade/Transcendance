export type ProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';

export interface UserProfile {
  username: string;
  location: { latitude: number; longitude: number } | null;
  description?: string;
  visibility: ProfileVisibility;
  profilePicture?: string;
}